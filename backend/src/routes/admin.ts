import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import User from '../models/User';
import ProductionRequest from '../models/ProductionRequest';
import { requireAdminRole, requireHigherAdminRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard data
 * @access Admin only
 */
router.get('/dashboard', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Get statistics based on admin level
    let stats: any = {};
    
    if (user.role === 'COUNTRY_ADMIN') {
      // Country-wide stats
      stats.totalUsers = await User.countDocuments({ country: user.country });
      stats.pendingVerifications = await User.countDocuments({ 
        country: user.country, 
        isVerified: false 
      });
      stats.totalProducers = await User.countDocuments({ 
        country: user.country, 
        role: 'PRODUCER' 
      });
      stats.totalBuyers = await User.countDocuments({ 
        country: user.country, 
        role: 'BUYER' 
      });
    } else if (user.role === 'STATE_ADMIN') {
      // State-wide stats
      stats.totalUsers = await User.countDocuments({ 
        country: user.country, 
        state: user.state 
      });
      stats.pendingVerifications = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        isVerified: false 
      });
      stats.totalProducers = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        role: 'PRODUCER' 
      });
      stats.totalBuyers = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        role: 'BUYER' 
      });
    } else if (user.role === 'CITY_ADMIN') {
      // City-wide stats
      stats.totalUsers = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        city: user.city 
      });
      stats.pendingVerifications = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        city: user.city, 
        isVerified: false 
      });
      stats.totalProducers = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        city: user.city, 
        role: 'PRODUCER' 
      });
      stats.totalBuyers = await User.countDocuments({ 
        country: user.country, 
        state: user.state, 
        city: user.city, 
        role: 'BUYER' 
      });
    }

    // Get pending production requests
    let pendingRequests = [];
    if (user.role === 'CITY_ADMIN') {
      pendingRequests = await ProductionRequest.find({ 
        status: 'PENDING',
        producer: { $in: await User.find({ 
          country: user.country, 
          state: user.state, 
          city: user.city 
        }).select('_id') }
      }).populate('producer', 'username organization');
    }

    res.json({
      success: true,
      stats,
      pendingRequests,
      adminLevel: user.role,
      location: {
        country: user.country,
        state: user.state,
        city: user.city
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get users under admin's jurisdiction
 * @access Admin only
 */
router.get('/users', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { role, status, page = 1, limit = 20 } = req.query;
    
    let query: any = {};
    
    // Filter by location based on admin level
    if (user.role === 'COUNTRY_ADMIN') {
      query.country = user.country;
    } else if (user.role === 'STATE_ADMIN') {
      query.country = user.country;
      query.state = user.state;
    } else if (user.role === 'CITY_ADMIN') {
      query.country = user.country;
      query.state = user.state;
      query.city = user.city;
    }
    
    // Additional filters
    if (role) query.role = role;
    if (status === 'verified') query.isVerified = true;
    if (status === 'pending') query.isVerified = false;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await User.find(query)
      .select('-nonce')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

/**
 * @route POST /api/admin/verify-user
 * @desc Verify a user account
 * @access Admin only
 */
router.post('/verify-user', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const admin = req.user;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }
    
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Check if admin can verify this user
    if (!admin.canVerifyUser(targetUser)) {
      return res.status(403).json({
        error: 'Cannot verify this user',
        message: 'User is outside your jurisdiction or you lack permission'
      });
    }
    
    if (targetUser.isVerified) {
      return res.status(400).json({
        error: 'User already verified'
      });
    }
    
    // Verify the user
    targetUser.isVerified = true;
    targetUser.verifiedBy = admin.walletAddress;
    targetUser.verifiedAt = new Date();
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'User verified successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
        isVerified: targetUser.isVerified,
        verifiedBy: targetUser.verifiedBy,
        verifiedAt: targetUser.verifiedAt
      }
    });
  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({
      error: 'Failed to verify user'
    });
  }
});

/**
 * @route POST /api/admin/revoke-verification
 * @desc Revoke user verification
 * @access Admin only
 */
router.post('/revoke-verification', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const admin = req.user;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }
    
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Check if admin can manage this user
    if (!admin.canVerifyUser(targetUser)) {
      return res.status(403).json({
        error: 'Cannot manage this user',
        message: 'User is outside your jurisdiction or you lack permission'
      });
    }
    
    if (!targetUser.isVerified) {
      return res.status(400).json({
        error: 'User is not verified'
      });
    }
    
    // Revoke verification
    targetUser.isVerified = false;
    targetUser.verifiedBy = undefined;
    targetUser.verifiedAt = undefined;
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'User verification revoked',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        role: targetUser.role,
        isVerified: targetUser.isVerified
      }
    });
  } catch (error) {
    console.error('Verification revocation error:', error);
    res.status(500).json({
      error: 'Failed to revoke verification'
    });
  }
});

/**
 * @route POST /api/admin/change-role
 * @desc Change user role
 * @access Admin only
 */
router.post('/change-role', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { userId, newRole } = req.body;
    const admin = req.user;
    
    if (!userId || !newRole) {
      return res.status(400).json({
        error: 'User ID and new role are required'
      });
    }
    
    if (!['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN', 'PRODUCER', 'BUYER', 'AUDITOR'].includes(newRole)) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }
    
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Check if admin can change to this role
    if (!admin.canAppoint.includes(newRole)) {
      return res.status(403).json({
        error: 'Cannot assign this role',
        message: 'You lack permission to assign this role'
      });
    }
    
    // Validate location requirements for new role
    if (['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(newRole)) {
      if (!targetUser.country) {
        return res.status(400).json({
          error: 'Country is required for admin roles'
        });
      }
      
      if (['STATE_ADMIN', 'CITY_ADMIN'].includes(newRole) && !targetUser.state) {
        return res.status(400).json({
          error: 'State is required for state and city admin roles'
        });
      }
      
      if (newRole === 'CITY_ADMIN' && !targetUser.city) {
        return res.status(400).json({
          error: 'City is required for city admin role'
        });
      }
    }
    
    // Change role
    const oldRole = targetUser.role;
    targetUser.role = newRole;
    
    // Reset verification if changing to admin role
    if (['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(newRole)) {
      targetUser.isVerified = false;
      targetUser.verifiedBy = undefined;
      targetUser.verifiedAt = undefined;
    }
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: 'User role changed successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        oldRole,
        newRole: targetUser.role,
        isVerified: targetUser.isVerified
      }
    });
  } catch (error) {
    console.error('Role change error:', error);
    res.status(500).json({
      error: 'Failed to change user role'
    });
  }
});

/**
 * @route GET /api/admin/production-requests
 * @desc Get production requests for certification
 * @access Admin only
 */
router.get('/production-requests', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;
    
    let query: any = { status: status || 'PENDING' };
    
    // Filter by location based on admin level
    if (user.role === 'CITY_ADMIN') {
      const cityUsers = await User.find({ 
        country: user.country, 
        state: user.state, 
        city: user.city 
      }).select('_id');
      
      query.producer = { $in: cityUsers.map(u => u._id) };
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const requests = await ProductionRequest.find(query)
      .populate('producer', 'username organization')
      .populate('certifiedBy', 'username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await ProductionRequest.countDocuments(query);
    
    res.json({
      success: true,
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Production requests fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch production requests'
    });
  }
});

/**
 * @route POST /api/admin/certify-production
 * @desc Certify a production request
 * @access Admin only
 */
router.post('/certify-production', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body;
    const admin = req.user;
    
    if (!requestId) {
      return res.status(400).json({
        error: 'Request ID is required'
      });
    }
    
    const request = await ProductionRequest.findById(requestId)
      .populate('producer', 'username organization');
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Request is not pending',
        currentStatus: request.status
      });
    }
    
    // Check if admin can certify this request
    if (admin.role === 'CITY_ADMIN') {
      const producer = await User.findById(request.producer);
      if (producer.country !== admin.country || 
          producer.state !== admin.state || 
          producer.city !== admin.city) {
        return res.status(403).json({
          error: 'Cannot certify this request',
          message: 'Producer is outside your jurisdiction'
        });
      }
    }
    
    // Certify the request
    await request.certify(admin._id, admin.walletAddress);
    
    res.json({
      success: true,
      message: 'Production request certified successfully',
      request: {
        id: request._id,
        requestId: request.requestId,
        producer: request.producer,
        amount: request.amount,
        status: request.status,
        certifiedBy: request.certifiedBy,
        certifiedAt: request.certifiedAt
      }
    });
  } catch (error) {
    console.error('Production certification error:', error);
    res.status(500).json({
      error: 'Failed to certify production request'
    });
  }
});

/**
 * @route POST /api/admin/reject-production
 * @desc Reject a production request
 * @access Admin only
 */
router.post('/reject-production', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const { requestId, reason } = req.body;
    const admin = req.user;
    
    if (!requestId || !reason) {
      return res.status(400).json({
        error: 'Request ID and rejection reason are required'
      });
    }
    
    const request = await ProductionRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Request is not pending',
        currentStatus: request.status
      });
    }
    
    // Reject the request
    await request.reject(reason);
    
    res.json({
      success: true,
      message: 'Production request rejected',
      request: {
        id: request._id,
        requestId: request.requestId,
        status: request.status,
        rejectionReason: request.rejectionReason
      }
    });
  } catch (error) {
    console.error('Production rejection error:', error);
    res.status(500).json({
      error: 'Failed to reject production request'
    });
  }
});

export default router;