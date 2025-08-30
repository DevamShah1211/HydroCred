const express = require('express');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('../config/blockchain');
const { authorizeRole, authorizeUserManagement } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin roles)
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const dateFrom = new Date();
    
    switch (period) {
      case '7d':
        dateFrom.setDate(now.getDate() - 7);
        break;
      case '30d':
        dateFrom.setDate(now.getDate() - 30);
        break;
      case '90d':
        dateFrom.setDate(now.getDate() - 90);
        break;
      case '1y':
        dateFrom.setFullYear(now.getFullYear() - 1);
        break;
      default:
        dateFrom.setDate(now.getDate() - 30);
    }

    // Build location filter based on admin level
    let locationFilter = {};
    if (req.user.role === 'city_admin') {
      locationFilter = {
        country: req.user.country,
        state: req.user.state,
        city: req.user.city
      };
    } else if (req.user.role === 'state_admin') {
      locationFilter = {
        country: req.user.country,
        state: req.user.state
      };
    } else if (req.user.role === 'country_admin') {
      locationFilter = {
        country: req.user.country
      };
    }

    // Get user statistics
    const userStats = await User.aggregate([
      { $match: locationFilter },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);

    // Get transaction statistics
    const txLocationFilter = {};
    Object.keys(locationFilter).forEach(key => {
      txLocationFilter[`metadata.location.${key}`] = locationFilter[key];
    });

    const transactionStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom, $lte: now },
          ...txLocationFilter
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          successRate: {
            $avg: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get pending verifications count
    const pendingVerifications = await User.countDocuments({
      ...locationFilter,
      isVerified: false,
      isActive: true
    });

    // Get recent security events
    const securityEvents = await AuditLog.find({
      'security.riskLevel': { $in: ['high', 'critical'] },
      createdAt: { $gte: dateFrom },
      ...Object.keys(locationFilter).reduce((acc, key) => {
        acc[`location.${key}`] = locationFilter[key];
        return acc;
      }, {})
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Format response
    const dashboard = {
      period,
      dateRange: { from: dateFrom, to: now },
      location: locationFilter,
      users: {
        total: userStats.reduce((sum, stat) => sum + stat.count, 0),
        verified: userStats.reduce((sum, stat) => sum + stat.verified, 0),
        active: userStats.reduce((sum, stat) => sum + stat.active, 0),
        pendingVerifications,
        breakdown: userStats
      },
      transactions: {
        total: transactionStats.reduce((sum, stat) => sum + stat.count, 0),
        totalAmount: transactionStats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0),
        avgSuccessRate: transactionStats.length > 0 
          ? transactionStats.reduce((sum, stat) => sum + stat.successRate, 0) / transactionStats.length 
          : 0,
        breakdown: transactionStats
      },
      security: {
        recentEvents: securityEvents.length,
        criticalEvents: securityEvents.filter(e => e.security.riskLevel === 'critical').length,
        highRiskEvents: securityEvents.filter(e => e.security.riskLevel === 'high').length,
        events: securityEvents.map(event => ({
          id: event._id,
          action: event.action,
          actor: event.actor.walletAddress,
          riskLevel: event.security.riskLevel,
          timestamp: event.createdAt,
          description: event.details.description
        }))
      }
    };

    res.json(dashboard);

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// @route   POST /api/admin/grant-role
// @desc    Grant role to user
// @access  Private (Admin roles with hierarchy)
router.post('/grant-role',
  [
    body('userAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format'),
    body('role')
      .isIn(['country_admin', 'state_admin', 'city_admin', 'producer', 'buyer', 'auditor'])
      .withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { userAddress, role } = req.body;

      // Find target user
      const targetUser = await User.findByWallet(userAddress);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if current user can grant this role to target user
      if (!req.user.canVerify(targetUser) && role !== 'auditor') {
        return res.status(403).json({ 
          error: 'Cannot grant role due to hierarchy restrictions' 
        });
      }

      // Special check for auditor role (only country admin)
      if (role === 'auditor' && req.user.role !== 'country_admin') {
        return res.status(403).json({ 
          error: 'Only country admin can grant auditor role' 
        });
      }

      // Get role constant from blockchain service
      const roles = blockchainService.getRoles();
      const roleConstant = roles[`${role.toUpperCase()}_ROLE`];

      if (!roleConstant) {
        return res.status(400).json({ error: 'Invalid role constant' });
      }

      // Check if user already has this role on blockchain
      const hasRole = await blockchainService.hasRole(roleConstant, userAddress);
      if (hasRole) {
        return res.status(400).json({ error: 'User already has this role on blockchain' });
      }

      // Grant role on blockchain
      const tx = await blockchainService.grantRole(roleConstant, userAddress);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      // Update user role in database
      const previousRole = targetUser.role;
      targetUser.role = role;
      await targetUser.save();

      // Create transaction record
      const transaction = new Transaction({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        type: 'role_assignment',
        from: req.user.walletAddress,
        to: userAddress,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: (receipt.gasUsed * (tx.gasPrice || 0n)).toString(),
        status: 'confirmed',
        confirmations: 1,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          },
          roleGranted: role,
          previousRole
        }
      });

      await transaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'role_change',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        target: {
          walletAddress: targetUser.walletAddress,
          userId: targetUser._id,
          role: targetUser.role,
          name: targetUser.name
        },
        details: {
          description: `Role granted: ${previousRole} → ${role}`,
          previousState: { role: previousRole },
          newState: { role: role },
          metadata: {
            transactionHash: tx.hash,
            roleConstant,
            grantedBy: req.user.walletAddress
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        location: {
          country: req.user.country,
          state: req.user.state,
          city: req.user.city
        },
        blockchain: {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          contractAddress: blockchainService.contractAddress
        },
        security: {
          riskLevel: 'high'
        }
      });

      res.json({
        message: 'Role granted successfully',
        transactionHash: tx.hash,
        user: {
          address: targetUser.walletAddress,
          name: targetUser.name,
          previousRole,
          newRole: role
        }
      });

    } catch (error) {
      console.error('Grant role error:', error);
      res.status(500).json({ error: 'Failed to grant role' });
    }
  }
);

// @route   GET /api/admin/fraud-alerts
// @desc    Get potential fraud alerts
// @access  Private (Admin roles)
router.get('/fraud-alerts', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    // Build location filter
    let locationFilter = {};
    if (req.user.role === 'city_admin') {
      locationFilter = {
        'metadata.location.country': req.user.country,
        'metadata.location.state': req.user.state,
        'metadata.location.city': req.user.city
      };
    } else if (req.user.role === 'state_admin') {
      locationFilter = {
        'metadata.location.country': req.user.country,
        'metadata.location.state': req.user.state
      };
    } else if (req.user.role === 'country_admin') {
      locationFilter = {
        'metadata.location.country': req.user.country
      };
    }

    // Look for suspicious patterns
    const suspiciousTransactions = await Transaction.find({
      ...locationFilter,
      $or: [
        // Multiple production requests from same producer in short time
        { type: 'production_request', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        // Failed transactions with high gas fees
        { status: 'failed', gasFee: { $gt: '1000000000000000000' } }, // > 1 ETH
        // Large amounts
        { amount: { $gt: 1000 } }
      ]
    })
    .populate('from', 'name organizationName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    // Look for users with suspicious activity
    const suspiciousUsers = await User.find({
      ...Object.keys(locationFilter).reduce((acc, key) => {
        const dbKey = key.replace('metadata.location.', '');
        acc[dbKey] = locationFilter[key];
        return acc;
      }, {}),
      $or: [
        // Unverified users with recent activity
        { isVerified: false, lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        // Suspended users trying to login
        { suspendedUntil: { $gt: new Date() }, lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    })
    .select('walletAddress name role isVerified suspendedUntil lastLogin')
    .limit(10);

    const total = suspiciousTransactions.length + suspiciousUsers.length;

    res.json({
      alerts: {
        transactions: suspiciousTransactions.map(tx => ({
          ...tx.toPublicJSON(),
          alertType: 'suspicious_transaction',
          alertReason: tx.status === 'failed' ? 'High gas fee failure' :
                     tx.amount > 1000 ? 'Large amount' :
                     'Multiple recent requests'
        })),
        users: suspiciousUsers.map(user => ({
          ...user.toPublicJSON(),
          alertType: 'suspicious_user',
          alertReason: !user.isVerified ? 'Unverified with recent activity' :
                      user.suspendedUntil > new Date() ? 'Suspended user attempting login' :
                      'Unknown'
        }))
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ error: 'Failed to get fraud alerts' });
  }
});

// @route   GET /api/admin/system-health
// @desc    Get system health status
// @access  Private (Admin roles)
router.get('/system-health', async (req, res) => {
  try {
    // Check blockchain connection
    const blockchainHealth = await blockchainService.healthCheck();

    // Check database health
    const dbHealth = {
      connected: true,
      collections: {}
    };

    try {
      dbHealth.collections.users = await User.countDocuments();
      dbHealth.collections.transactions = await Transaction.countDocuments();
      dbHealth.collections.auditLogs = await AuditLog.countDocuments();
    } catch (dbError) {
      dbHealth.connected = false;
      dbHealth.error = dbError.message;
    }

    // Check for pending transactions
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });

    // Check for failed transactions in last hour
    const recentFailures = await Transaction.countDocuments({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    // System performance metrics
    const performance = {
      pendingTransactions,
      recentFailures,
      avgResponseTime: 0, // Could be calculated from audit logs
      errorRate: recentFailures > 10 ? 'high' : recentFailures > 5 ? 'medium' : 'low'
    };

    res.json({
      timestamp: new Date(),
      status: blockchainHealth.connected && dbHealth.connected ? 'healthy' : 'degraded',
      services: {
        blockchain: blockchainHealth,
        database: dbHealth
      },
      performance,
      alerts: {
        critical: recentFailures > 10,
        warnings: pendingTransactions > 50
      }
    });

  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ 
      timestamp: new Date(),
      status: 'unhealthy',
      error: error.message 
    });
  }
});

module.exports = router;