import { Router, Request, Response } from 'express';
import { requireAuditorRole } from '../middleware/auth';
import ProductionRequest from '../models/ProductionRequest';
import User from '../models/User';

const router = Router();

/**
 * @route GET /api/audit/dashboard
 * @desc Get auditor dashboard data
 * @access Auditor only
 */
router.get('/dashboard', requireAuditorRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Get audit statistics
    const totalUsers = await User.countDocuments();
    const totalProducers = await User.countDocuments({ role: 'PRODUCER' });
    const totalBuyers = await User.countDocuments({ role: 'BUYER' });
    const totalAdmins = await User.countDocuments({ 
      role: { $in: ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'] } 
    });
    
    const totalRequests = await ProductionRequest.countDocuments();
    const pendingRequests = await ProductionRequest.countDocuments({ status: 'PENDING' });
    const certifiedRequests = await ProductionRequest.countDocuments({ status: 'CERTIFIED' });
    const mintedRequests = await ProductionRequest.countDocuments({ status: 'TOKENS_MINTED' });
    const rejectedRequests = await ProductionRequest.countDocuments({ status: 'REJECTED' });
    
    // Calculate total production
    const totalProduction = await ProductionRequest.aggregate([
      { $match: { status: { $in: ['CERTIFIED', 'TOKENS_MINTED'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmount = totalProduction.length > 0 ? totalProduction[0].total : 0;
    
    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          producers: totalProducers,
          buyers: totalBuyers,
          admins: totalAdmins
        },
        production: {
          totalRequests,
          pendingRequests,
          certifiedRequests,
          mintedRequests,
          rejectedRequests,
          totalAmount
        }
      },
      auditor: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Auditor dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @route GET /api/audit/export
 * @desc Export transaction history as JSON/CSV
 * @access Auditor only
 */
router.get('/export', requireAuditorRole, async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate, type } = req.query;
    
    let query: any = {};
    
    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    
    // Type filtering
    if (type === 'production') {
      // Production requests
      const requests = await ProductionRequest.find(query)
        .populate('producer', 'username organization walletAddress')
        .populate('certifiedBy', 'username role walletAddress')
        .sort({ createdAt: -1 });
      
      if (format === 'csv') {
        // TODO: Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="production-audit.csv"');
        res.send('CSV export not yet implemented');
      } else {
        res.json({
          success: true,
          type: 'production',
          count: requests.length,
          data: requests
        });
      }
    } else if (type === 'users') {
      // User data
      const users = await User.find(query)
        .select('-nonce')
        .sort({ createdAt: -1 });
      
      if (format === 'csv') {
        // TODO: Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users-audit.csv"');
        res.send('CSV export not yet implemented');
      } else {
        res.json({
          success: true,
          type: 'users',
          count: users.length,
          data: users
        });
      }
    } else {
      // All data
      const requests = await ProductionRequest.find(query)
        .populate('producer', 'username organization walletAddress')
        .populate('certifiedBy', 'username role walletAddress')
        .sort({ createdAt: -1 });
      
      const users = await User.find(query)
        .select('-nonce')
        .sort({ createdAt: -1 });
      
      if (format === 'csv') {
        // TODO: Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="full-audit.csv"');
        res.send('CSV export not yet implemented');
      } else {
        res.json({
          success: true,
          type: 'full',
          summary: {
            totalUsers: users.length,
            totalRequests: requests.length
          },
          data: {
            users,
            productionRequests: requests
          }
        });
      }
    }
  } catch (error) {
    console.error('Audit export error:', error);
    res.status(500).json({
      error: 'Failed to export audit data'
    });
  }
});

/**
 * @route GET /api/audit/production-requests
 * @desc Get production requests for audit
 * @access Auditor only
 */
router.get('/production-requests', requireAuditorRole, async (req: Request, res: Response) => {
  try {
    const { status, producer, certifier, page = 1, limit = 20 } = req.query;
    
    let query: any = {};
    
    if (status) query.status = status;
    if (producer) query.producer = producer;
    if (certifier) query.certifiedBy = certifier;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const requests = await ProductionRequest.find(query)
      .populate('producer', 'username organization walletAddress')
      .populate('certifiedBy', 'username role walletAddress')
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
    console.error('Production requests audit error:', error);
    res.status(500).json({
      error: 'Failed to fetch production requests'
    });
  }
});

/**
 * @route GET /api/audit/users
 * @desc Get users for audit
 * @access Auditor only
 */
router.get('/users', requireAuditorRole, async (req: Request, res: Response) => {
  try {
    const { role, status, country, state, city, page = 1, limit = 20 } = req.query;
    
    let query: any = {};
    
    if (role) query.role = role;
    if (status === 'verified') query.isVerified = true;
    if (status === 'pending') query.isVerified = false;
    if (country) query.country = country;
    if (state) query.state = state;
    if (city) query.city = city;
    
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
    console.error('Users audit error:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

export default router;