const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authorizeRole, authorizeUserManagement } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().trim().isLength({ min: 10, max: 20 }),
  body('organizationName').optional().trim().isLength({ max: 200 }),
  body('productionCapacity').optional().isNumeric(),
  body('annualHydrogenNeed').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const user = await User.findById(req.userId);
    const previousState = user.toObject();

    // Update allowed fields
    const allowedUpdates = [
      'name', 'email', 'phoneNumber', 'organizationName', 
      'productionCapacity', 'annualHydrogenNeed', 'preferences'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Create audit log
    await AuditLog.createLog({
      action: 'profile_update',
      actor: {
        walletAddress: user.walletAddress,
        userId: user._id,
        role: user.role,
        name: user.name
      },
      details: {
        description: 'User updated their profile',
        previousState: { 
          name: previousState.name,
          email: previousState.email,
          phoneNumber: previousState.phoneNumber
        },
        newState: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      },
      request: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by role and location
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { role, country, state, city, verified, limit = 20, page = 1 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (country) query.country = new RegExp(country, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (city) query.city = new RegExp(city, 'i');
    if (verified !== undefined) query.isVerified = verified === 'true';

    // Only show active users
    query.isActive = true;

    const users = await User.find(query)
      .select('walletAddress name role country state city isVerified organizationName')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users: users.map(user => user.toPublicJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// @route   POST /api/users/:userId/verify
// @desc    Verify a user (admin only)
// @access  Private (Admin roles)
router.post('/:userId/verify', 
  authorizeRole(['country_admin', 'state_admin', 'city_admin']),
  authorizeUserManagement,
  async (req, res) => {
    try {
      const targetUser = req.targetUser;

      if (targetUser.isVerified) {
        return res.status(400).json({ error: 'User already verified' });
      }

      const previousState = targetUser.toObject();
      
      targetUser.isVerified = true;
      targetUser.verifiedBy = req.userId;
      targetUser.verificationDate = new Date();
      
      await targetUser.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'user_verification',
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
          description: `User verified by ${req.user.role}`,
          previousState: { isVerified: previousState.isVerified },
          newState: { isVerified: true },
          metadata: {
            verifiedBy: req.user.walletAddress,
            verificationDate: targetUser.verificationDate
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'medium'
        }
      });

      res.json({
        message: 'User verified successfully',
        user: targetUser.toPublicJSON()
      });
    } catch (error) {
      console.error('Verify user error:', error);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  }
);

// @route   POST /api/users/:userId/suspend
// @desc    Suspend a user (admin only)
// @access  Private (Admin roles)
router.post('/:userId/suspend',
  authorizeRole(['country_admin', 'state_admin', 'city_admin']),
  authorizeUserManagement,
  [
    body('reason').notEmpty().withMessage('Suspension reason is required'),
    body('duration').isNumeric().withMessage('Duration in days is required')
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

      const { reason, duration } = req.body;
      const targetUser = req.targetUser;

      if (targetUser.walletAddress === req.user.walletAddress) {
        return res.status(400).json({ error: 'Cannot suspend yourself' });
      }

      const previousState = targetUser.toObject();
      const suspensionEndDate = new Date();
      suspensionEndDate.setDate(suspensionEndDate.getDate() + parseInt(duration));

      targetUser.suspendedUntil = suspensionEndDate;
      targetUser.suspensionReason = reason;
      
      await targetUser.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'user_suspension',
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
          description: `User suspended for ${duration} days`,
          previousState: { 
            suspendedUntil: previousState.suspendedUntil,
            suspensionReason: previousState.suspensionReason
          },
          newState: { 
            suspendedUntil: targetUser.suspendedUntil,
            suspensionReason: targetUser.suspensionReason
          },
          metadata: {
            reason,
            duration: parseInt(duration),
            suspensionEndDate
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'high'
        }
      });

      res.json({
        message: 'User suspended successfully',
        suspendedUntil: suspensionEndDate,
        reason
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ error: 'Failed to suspend user' });
    }
  }
);

// @route   POST /api/users/:userId/unsuspend
// @desc    Unsuspend a user (admin only)
// @access  Private (Admin roles)
router.post('/:userId/unsuspend',
  authorizeRole(['country_admin', 'state_admin', 'city_admin']),
  authorizeUserManagement,
  async (req, res) => {
    try {
      const targetUser = req.targetUser;

      if (!targetUser.suspendedUntil || targetUser.suspendedUntil <= new Date()) {
        return res.status(400).json({ error: 'User is not suspended' });
      }

      const previousState = targetUser.toObject();

      targetUser.suspendedUntil = null;
      targetUser.suspensionReason = null;
      
      await targetUser.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'user_unsuspension',
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
          description: 'User suspension lifted',
          previousState: { 
            suspendedUntil: previousState.suspendedUntil,
            suspensionReason: previousState.suspensionReason
          },
          newState: { 
            suspendedUntil: null,
            suspensionReason: null
          }
        },
        request: {
          method: req.method,
          endpoint: req.path,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        },
        security: {
          riskLevel: 'medium'
        }
      });

      res.json({
        message: 'User suspension lifted successfully',
        user: targetUser.toPublicJSON()
      });
    } catch (error) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({ error: 'Failed to unsuspend user' });
    }
  }
);

// @route   GET /api/users/pending-verification
// @desc    Get users pending verification (admin only)
// @access  Private (Admin roles)
router.get('/pending-verification', 
  authorizeRole(['country_admin', 'state_admin', 'city_admin']),
  async (req, res) => {
    try {
      const { limit = 20, page = 1 } = req.query;
      
      // Build query based on admin's hierarchy level
      const query = { 
        isVerified: false,
        isActive: true
      };

      // Admin can only see users they can verify
      if (req.user.role === 'city_admin') {
        query.role = { $in: ['producer', 'buyer'] };
        query.country = req.user.country;
        query.state = req.user.state;
        query.city = req.user.city;
      } else if (req.user.role === 'state_admin') {
        query.role = { $in: ['city_admin', 'producer', 'buyer'] };
        query.country = req.user.country;
        query.state = req.user.state;
      } else if (req.user.role === 'country_admin') {
        query.country = req.user.country;
      }

      const users = await User.find(query)
        .select('walletAddress name role country state city organizationName createdAt')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: 1 });

      const total = await User.countDocuments(query);

      res.json({
        users: users.map(user => user.toPublicJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get pending verification error:', error);
      res.status(500).json({ error: 'Failed to get pending verifications' });
    }
  }
);

module.exports = router;