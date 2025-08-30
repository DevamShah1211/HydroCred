import { Router, Request, Response } from 'express';
import { requireBuyerRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/buyer/dashboard
 * @desc Get buyer dashboard data
 * @access Buyer only
 */
router.get('/dashboard', requireBuyerRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // TODO: Implement buyer dashboard with credit balance, purchase history, etc.
    // This would integrate with the blockchain to get actual token balances
    
    res.json({
      success: true,
      message: 'Buyer dashboard endpoint - to be implemented with blockchain integration',
      buyer: {
        id: user._id,
        username: user.username,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data'
    });
  }
});

export default router;