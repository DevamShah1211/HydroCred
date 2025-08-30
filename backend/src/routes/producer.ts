import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import ProductionRequest from '../models/ProductionRequest';
import { requireProducerRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/producer/dashboard
 * @desc Get producer dashboard data
 * @access Producer only
 */
router.get('/dashboard', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Get production statistics
    const totalRequests = await ProductionRequest.countDocuments({ producer: user._id });
    const pendingRequests = await ProductionRequest.countDocuments({ 
      producer: user._id, 
      status: 'PENDING' 
    });
    const certifiedRequests = await ProductionRequest.countDocuments({ 
      producer: user._id, 
      status: 'CERTIFIED' 
    });
    const mintedRequests = await ProductionRequest.countDocuments({ 
      producer: user._id, 
      status: 'TOKENS_MINTED' 
    });
    const rejectedRequests = await ProductionRequest.countDocuments({ 
      producer: user._id, 
      status: 'REJECTED' 
    });
    
    // Calculate total production amount
    const totalProduction = await ProductionRequest.aggregate([
      { $match: { producer: user._id, status: { $in: ['CERTIFIED', 'TOKENS_MINTED'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmount = totalProduction.length > 0 ? totalProduction[0].total : 0;
    
    // Get recent requests
    const recentRequests = await ProductionRequest.find({ producer: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('certifiedBy', 'username role');
    
    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        certifiedRequests,
        mintedRequests,
        rejectedRequests,
        totalProduction: totalAmount
      },
      recentRequests,
      producer: {
        id: user._id,
        username: user.username,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Producer dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @route POST /api/producer/submit-request
 * @desc Submit a new production request
 * @access Producer only
 */
router.post('/submit-request', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const { amount, proofHash, proofDocuments } = req.body;
    const user = req.user;
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid production amount is required'
      });
    }
    
    if (!proofHash || proofHash.trim() === '') {
      return res.status(400).json({
        error: 'Proof hash is required'
      });
    }
    
    // Check if user has pending requests
    const pendingCount = await ProductionRequest.countDocuments({ 
      producer: user._id, 
      status: 'PENDING' 
    });
    
    if (pendingCount >= 5) {
      return res.status(400).json({
        error: 'Too many pending requests',
        message: 'You can have maximum 5 pending requests at a time'
      });
    }
    
    // Create production request
    const request = new ProductionRequest({
      producer: user._id,
      producerWallet: user.walletAddress,
      amount: Number(amount),
      proofHash: proofHash.trim(),
      proofDocuments: proofDocuments || [],
      status: 'PENDING'
    });
    
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Production request submitted successfully',
      request: {
        id: request._id,
        requestId: request.requestId,
        amount: request.amount,
        proofHash: request.proofHash,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    console.error('Production request submission error:', error);
    res.status(500).json({
      error: 'Failed to submit production request'
    });
  }
});

/**
 * @route GET /api/producer/requests
 * @desc Get producer's production requests
 * @access Producer only
 */
router.get('/requests', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;
    
    let query: any = { producer: user._id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const requests = await ProductionRequest.find(query)
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
 * @route GET /api/producer/requests/:id
 * @desc Get specific production request details
 * @access Producer only
 */
router.get('/requests/:id', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const request = await ProductionRequest.findById(id)
      .populate('producer', 'username organization')
      .populate('certifiedBy', 'username role');
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    // Ensure producer can only access their own requests
    if (request.producer.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own production requests'
      });
    }
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Production request fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch production request'
    });
  }
});

/**
 * @route PUT /api/producer/requests/:id
 * @desc Update production request (only if pending)
 * @access Producer only
 */
router.put('/requests/:id', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, proofHash, proofDocuments } = req.body;
    const user = req.user;
    
    const request = await ProductionRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    // Ensure producer can only update their own requests
    if (request.producer.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own production requests'
      });
    }
    
    // Only allow updates if request is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot update request',
        message: 'Only pending requests can be updated',
        currentStatus: request.status
      });
    }
    
    // Update fields
    if (amount !== undefined && amount > 0) {
      request.amount = Number(amount);
    }
    
    if (proofHash !== undefined && proofHash.trim() !== '') {
      request.proofHash = proofHash.trim();
    }
    
    if (proofDocuments !== undefined) {
      request.proofDocuments = proofDocuments;
    }
    
    await request.save();
    
    res.json({
      success: true,
      message: 'Production request updated successfully',
      request: {
        id: request._id,
        requestId: request.requestId,
        amount: request.amount,
        proofHash: request.proofHash,
        proofDocuments: request.proofDocuments,
        status: request.status,
        updatedAt: request.updatedAt
      }
    });
  } catch (error) {
    console.error('Production request update error:', error);
    res.status(500).json({
      error: 'Failed to update production request'
    });
  }
});

/**
 * @route DELETE /api/producer/requests/:id
 * @desc Cancel production request (only if pending)
 * @access Producer only
 */
router.delete('/requests/:id', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const request = await ProductionRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    // Ensure producer can only cancel their own requests
    if (request.producer.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel your own production requests'
      });
    }
    
    // Only allow cancellation if request is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot cancel request',
        message: 'Only pending requests can be cancelled',
        currentStatus: request.status
      });
    }
    
    await request.deleteOne();
    
    res.json({
      success: true,
      message: 'Production request cancelled successfully'
    });
  } catch (error) {
    console.error('Production request cancellation error:', error);
    res.status(500).json({
      error: 'Failed to cancel production request'
    });
  }
});

/**
 * @route GET /api/producer/certified-requests
 * @desc Get certified production requests ready for token minting
 * @access Producer only
 */
router.get('/certified-requests', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    const certifiedRequests = await ProductionRequest.find({
      producer: user._id,
      status: 'CERTIFIED',
      tokensMinted: false
    }).populate('certifiedBy', 'username role');
    
    res.json({
      success: true,
      certifiedRequests,
      count: certifiedRequests.length
    });
  } catch (error) {
    console.error('Certified requests fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch certified requests'
    });
  }
});

/**
 * @route POST /api/producer/mint-tokens
 * @desc Mark tokens as minted for a certified request
 * @access Producer only
 */
router.post('/mint-tokens', requireProducerRole, async (req: Request, res: Response) => {
  try {
    const { requestId, blockchainTxHash } = req.body;
    const user = req.user;
    
    if (!requestId) {
      return res.status(400).json({
        error: 'Request ID is required'
      });
    }
    
    if (!blockchainTxHash) {
      return res.status(400).json({
        error: 'Blockchain transaction hash is required'
      });
    }
    
    const request = await ProductionRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        error: 'Production request not found'
      });
    }
    
    // Ensure producer can only mint for their own requests
    if (request.producer.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only mint tokens for your own production requests'
      });
    }
    
    // Check if request is certified and ready for minting
    if (request.status !== 'CERTIFIED') {
      return res.status(400).json({
        error: 'Request not ready for minting',
        message: 'Only certified requests can have tokens minted',
        currentStatus: request.status
      });
    }
    
    if (request.tokensMinted) {
      return res.status(400).json({
        error: 'Tokens already minted',
        message: 'This request already has tokens minted'
      });
    }
    
    // Mark tokens as minted
    await request.markTokensMinted(blockchainTxHash);
    
    res.json({
      success: true,
      message: 'Tokens marked as minted successfully',
      request: {
        id: request._id,
        requestId: request.requestId,
        amount: request.amount,
        status: request.status,
        tokensMinted: request.tokensMinted,
        blockchainTxHash: request.blockchainTxHash,
        mintedAt: request.mintedAt
      }
    });
  } catch (error) {
    console.error('Token minting error:', error);
    res.status(500).json({
      error: 'Failed to mark tokens as minted'
    });
  }
});

export default router;