const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user's transactions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      $or: [
        { from: req.user.walletAddress },
        { to: req.user.walletAddress }
      ]
    };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map(tx => tx.toPublicJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// @route   GET /api/transactions/:txHash
// @desc    Get transaction by hash
// @access  Private
router.get('/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const transaction = await Transaction.findOne({ txHash });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    if (transaction.from.toLowerCase() !== req.user.walletAddress.toLowerCase() &&
        transaction.to?.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied to this transaction' });
    }

    res.json({ transaction: transaction.toPublicJSON() });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

module.exports = router;