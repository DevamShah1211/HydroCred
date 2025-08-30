const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  }
});

// Validation middleware
const validateRegistration = [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  body('signature')
    .isLength({ min: 1 })
    .withMessage('Signature is required'),
  body('message')
    .isLength({ min: 1 })
    .withMessage('Message is required'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .isIn(['country_admin', 'state_admin', 'city_admin', 'producer', 'buyer', 'auditor'])
    .withMessage('Invalid role'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required'),
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
];

const validateLogin = [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  body('signature')
    .isLength({ min: 1 })
    .withMessage('Signature is required'),
  body('message')
    .isLength({ min: 1 })
    .withMessage('Message is required')
];

// Helper function to verify wallet signature
const verifyWalletSignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Helper function to validate message format and timestamp
const validateMessage = (message) => {
  try {
    const messageData = JSON.parse(message);
    
    // Check required fields
    if (!messageData.action || !messageData.timestamp || !messageData.nonce) {
      return { valid: false, error: 'Missing required message fields' };
    }
    
    // Check timestamp (should not be older than 10 minutes)
    const timestamp = new Date(messageData.timestamp);
    const now = new Date();
    const timeDiff = now - timestamp;
    
    if (timeDiff > 10 * 60 * 1000) { // 10 minutes
      return { valid: false, error: 'Message timestamp expired' };
    }
    
    if (timestamp > now) {
      return { valid: false, error: 'Invalid message timestamp' };
    }
    
    return { valid: true, data: messageData };
  } catch (error) {
    return { valid: false, error: 'Invalid message format' };
  }
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      walletAddress: user.walletAddress,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const {
      walletAddress,
      signature,
      message,
      name,
      email,
      role,
      country,
      state,
      city,
      organizationName,
      organizationType,
      productionCapacity,
      industryType,
      annualHydrogenNeed,
      phoneNumber
    } = req.body;

    // Validate message
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return res.status(400).json({ error: messageValidation.error });
    }

    // Verify wallet signature
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { walletAddress: walletAddress.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        field: existingUser.walletAddress.toLowerCase() === walletAddress.toLowerCase() 
          ? 'walletAddress' : 'email'
      });
    }

    // Validate role-specific requirements
    if (role === 'producer' && !productionCapacity) {
      return res.status(400).json({ error: 'Production capacity required for producers' });
    }

    if (role === 'buyer' && (!industryType || !annualHydrogenNeed)) {
      return res.status(400).json({ error: 'Industry type and annual hydrogen need required for buyers' });
    }

    if (['city_admin', 'producer', 'buyer'].includes(role) && !city) {
      return res.status(400).json({ error: 'City is required for this role' });
    }

    if (['state_admin', 'city_admin', 'producer', 'buyer'].includes(role) && !state) {
      return res.status(400).json({ error: 'State is required for this role' });
    }

    // Create user
    const userData = {
      walletAddress: walletAddress.toLowerCase(),
      name,
      email: email.toLowerCase(),
      role,
      country,
      state,
      city,
      phoneNumber,
      organizationName,
      organizationType,
      productionCapacity,
      industryType,
      annualHydrogenNeed
    };

    const user = new User(userData);
    await user.save();

    // Create audit log
    await AuditLog.createLog({
      action: 'user_registration',
      actor: {
        walletAddress: user.walletAddress,
        userId: user._id,
        role: user.role,
        name: user.name
      },
      details: {
        description: `New user registered with role: ${user.role}`,
        metadata: {
          role: user.role,
          country: user.country,
          state: user.state,
          city: user.city,
          organizationType: user.organizationType
        }
      },
      request: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      },
      location: {
        country: user.country,
        state: user.state,
        city: user.city
      }
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toPublicJSON(),
      requiresVerification: !user.isVerified
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { walletAddress, signature, message } = req.body;

    // Validate message
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
      return res.status(400).json({ error: messageValidation.error });
    }

    // Verify wallet signature
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    // Find user
    const user = await User.findByWallet(walletAddress);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    // Check if user is suspended
    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({ 
        error: 'Account suspended',
        suspendedUntil: user.suspendedUntil,
        reason: user.suspensionReason
      });
    }

    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Create audit log
    await AuditLog.createLog({
      action: 'user_login',
      actor: {
        walletAddress: user.walletAddress,
        userId: user._id,
        role: user.role,
        name: user.name
      },
      details: {
        description: 'User logged in successfully',
        metadata: {
          loginCount: user.loginCount,
          lastLogin: user.lastLogin
        }
      },
      request: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      },
      location: {
        country: user.country,
        state: user.state,
        city: user.city
      }
    });

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user);
    
    res.json({
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (mainly for logging purposes)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Create audit log
    await AuditLog.createLog({
      action: 'user_logout',
      actor: {
        walletAddress: req.user.walletAddress,
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      details: {
        description: 'User logged out'
      },
      request: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// @route   GET /api/auth/nonce
// @desc    Get nonce for wallet signature
// @access  Public
router.get('/nonce/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Generate nonce
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = new Date().toISOString();

    res.json({
      nonce,
      timestamp,
      message: JSON.stringify({
        action: 'authenticate',
        walletAddress: walletAddress.toLowerCase(),
        timestamp,
        nonce
      })
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

module.exports = router;