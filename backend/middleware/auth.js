const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Verify JWT token and wallet signature
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Check if user is suspended
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({ 
        error: 'Account suspended',
        suspendedUntil: user.suspendedUntil,
        reason: user.suspensionReason
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.walletAddress = user.walletAddress;
    req.userRole = user.role;

    // Update last login
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authorize specific roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      AuditLog.createLog({
        action: 'security_event',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Unauthorized access attempt to ${req.method} ${req.path}`,
          metadata: {
            requiredRoles: allowedRoles,
            userRole: req.user.role,
            endpoint: req.path,
            method: req.method
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'high',
          flags: ['unauthorized_access_attempt']
        },
        result: {
          status: 'failure',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        }
      }).catch(console.error);

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Verify wallet ownership (for sensitive operations)
const verifyWalletSignature = async (req, res, next) => {
  try {
    const { message, signature } = req.body;
    
    if (!message || !signature) {
      return res.status(400).json({ 
        error: 'Message and signature required for wallet verification' 
      });
    }

    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Check if recovered address matches user's wallet
    if (recoveredAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      // Log potential security issue
      await AuditLog.createLog({
        action: 'security_event',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: 'Wallet signature verification failed',
          metadata: {
            expectedAddress: req.user.walletAddress,
            recoveredAddress,
            message,
            signature
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'critical',
          flags: ['signature_verification_failed', 'potential_impersonation']
        },
        result: {
          status: 'failure',
          errorCode: 'SIGNATURE_VERIFICATION_FAILED'
        }
      });

      return res.status(401).json({ error: 'Wallet signature verification failed' });
    }

    // Verify message format and timestamp (prevent replay attacks)
    try {
      const messageData = JSON.parse(message);
      const timestamp = new Date(messageData.timestamp);
      const now = new Date();
      
      // Message should not be older than 5 minutes
      if (now - timestamp > 5 * 60 * 1000) {
        return res.status(401).json({ error: 'Message timestamp expired' });
      }
      
      // Message should not be from the future
      if (timestamp > now) {
        return res.status(401).json({ error: 'Invalid message timestamp' });
      }
      
      req.verifiedMessage = messageData;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    next();
  } catch (error) {
    console.error('Wallet signature verification error:', error);
    res.status(500).json({ error: 'Signature verification failed' });
  }
};

// Check if user can manage another user (hierarchy check)
const authorizeUserManagement = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Check if current user can manage target user
    if (!req.user.canVerify(targetUser)) {
      return res.status(403).json({ 
        error: 'Cannot manage this user due to hierarchy restrictions',
        details: {
          yourRole: req.user.role,
          targetRole: targetUser.role,
          yourLocation: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          },
          targetLocation: {
            country: targetUser.country,
            state: targetUser.state,
            city: targetUser.city
          }
        }
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    console.error('User management authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many sensitive operations from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.user?.walletAddress || 'anonymous'}`;
  }
});

// Middleware to log API access
const logApiAccess = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Continue with request
    next();
    
    // Log after response (in background)
    res.on('finish', async () => {
      try {
        const responseTime = Date.now() - startTime;
        
        await AuditLog.createLog({
          action: action || 'api_access',
          actor: {
            walletAddress: req.user?.walletAddress || 'anonymous',
            userId: req.user?._id,
            role: req.user?.role || 'anonymous',
            name: req.user?.name
          },
          details: {
            description: `API access: ${req.method} ${req.path}`,
            metadata: {
              endpoint: req.path,
              method: req.method,
              statusCode: res.statusCode,
              responseTime
            }
          },
          request: {
            method: req.method,
            endpoint: req.path,
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          },
          result: {
            status: res.statusCode < 400 ? 'success' : 'failure',
            responseTime
          }
        });
      } catch (logError) {
        console.error('Failed to log API access:', logError);
      }
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  verifyWalletSignature,
  authorizeUserManagement,
  sensitiveOperationLimit,
  logApiAccess
};