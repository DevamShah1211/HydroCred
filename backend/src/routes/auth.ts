import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import User from '../models/User';
import { authenticateWallet } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/auth/nonce
 * @desc Get nonce for wallet authentication
 * @access Public
 */
router.post('/nonce', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      });
    }

    // Find or create user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please complete onboarding first'
      });
    }

    // Generate new nonce
    user.nonce = ethers.randomBytes(32).toString('hex');
    await user.save();

    res.json({
      nonce: user.nonce,
      message: `Sign this message to authenticate: ${user.nonce}`,
      user: {
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({
      error: 'Failed to generate nonce'
    });
  }
});

/**
 * @route POST /api/auth/verify
 * @desc Verify wallet signature and authenticate user
 * @access Public
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { signature, message, walletAddress } = req.body;

    if (!signature || !message || !walletAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['signature', 'message', 'walletAddress']
      });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        error: 'Invalid signature'
      });
    }

    // Find user
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Please complete onboarding first'
      });
    }

    // Verify nonce matches
    if (message !== `Sign this message to authenticate: ${user.nonce}`) {
      return res.status(401).json({
        error: 'Invalid nonce',
        message: 'Nonce mismatch. Please request a new nonce.'
      });
    }

    // Generate new nonce for next login
    user.nonce = ethers.randomBytes(32).toString('hex');
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        country: user.country,
        state: user.state,
        city: user.city,
        organization: user.organization,
        isVerified: user.isVerified,
        verifiedBy: user.verifiedBy,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt
      },
      auth: {
        signature,
        message,
        walletAddress
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Authentication failed'
    });
  }
});

/**
 * @route POST /api/auth/onboard
 * @desc Create new user account
 * @access Public
 */
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      username,
      email,
      role,
      country,
      state,
      city,
      organization
    } = req.body;

    // Validation
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      });
    }

    if (!username || username.length < 3) {
      return res.status(400).json({
        error: 'Username must be at least 3 characters long'
      });
    }

    if (!role || !['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN', 'PRODUCER', 'BUYER', 'AUDITOR'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    // Check if wallet already exists
    const existingWallet = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (existingWallet) {
      return res.status(409).json({
        error: 'Wallet address already registered'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already taken'
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          error: 'Email already registered'
        });
      }
    }

    // Validate location requirements based on role
    if (['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(role) && !country) {
      return res.status(400).json({
        error: 'Country is required for admin roles'
      });
    }

    if (['STATE_ADMIN', 'CITY_ADMIN'].includes(role) && !state) {
      return res.status(400).json({
        error: 'State is required for state and city admin roles'
      });
    }

    if (role === 'CITY_ADMIN' && !city) {
      return res.status(400).json({
        error: 'City is required for city admin role'
      });
    }

    // Create user
    const user = new User({
      walletAddress: walletAddress.toLowerCase(),
      username,
      email,
      role,
      country,
      state,
      city,
      organization,
      isVerified: false, // Requires admin verification
      nonce: ethers.randomBytes(32).toString('hex')
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Pending admin verification.',
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        role: user.role,
        country: user.country,
        state: user.state,
        city: user.city,
        organization: user.organization,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      error: 'Failed to create account'
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get user profile (authenticated)
 * @access Private
 */
router.get('/profile', authenticateWallet, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-nonce');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        role: user.role,
        country: user.country,
        state: user.state,
        city: user.city,
        organization: user.organization,
        isVerified: user.isVerified,
        verifiedBy: user.verifiedBy,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile (authenticated)
 * @access Private
 */
router.put('/profile', authenticateWallet, async (req: Request, res: Response) => {
  try {
    const { username, email, organization } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update allowed fields
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(409).json({
          error: 'Username already taken'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(409).json({
          error: 'Email already registered'
        });
      }
      user.email = email;
    }

    if (organization !== undefined) {
      user.organization = organization;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        email: user.email,
        role: user.role,
        country: user.country,
        state: user.state,
        city: user.city,
        organization: user.organization,
        isVerified: user.isVerified,
        verifiedBy: user.verifiedBy,
        verifiedAt: user.verifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

export default router;