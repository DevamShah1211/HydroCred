const express = require('express');
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');

const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('../config/blockchain');
const { authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateMarketListing = [
  body('amount')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('Amount must be a positive number'),
  body('pricePerToken')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('Price per token must be positive')
];

const validatePurchase = [
  body('listingId')
    .isNumeric()
    .withMessage('Listing ID must be a number'),
  body('amount')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('Amount must be a positive number')
];

// @route   POST /api/marketplace/list
// @desc    Create a marketplace listing
// @access  Private (Producers and Buyers who own credits)
router.post('/list',
  authorizeRole(['producer', 'buyer']),
  validateMarketListing,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { amount, pricePerToken } = req.body;
      
      if (!req.user.isVerified) {
        return res.status(403).json({ 
          error: 'Account must be verified to create marketplace listings' 
        });
      }

      // Check user's balance
      const balance = await blockchainService.getBalance(req.user.walletAddress);
      if (balance < amount) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          balance: balance.toString(),
          requested: amount.toString()
        });
      }

      // Convert price to wei (assuming price is in ETH)
      const priceInWei = ethers.parseEther(pricePerToken.toString());

      // Submit to blockchain
      const tx = await blockchainService.createMarketListing(
        parseInt(amount),
        priceInWei.toString()
      );

      // Wait for transaction receipt to get listing ID
      const receipt = await tx.wait();
      
      // Find the MarketListingCreated event
      let listingId = null;
      if (receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = blockchainService.contract.interface.parseLog(log);
            if (parsedLog.name === 'MarketListingCreated') {
              listingId = Number(parsedLog.args.listingId);
              break;
            }
          } catch (parseError) {
            // Skip non-contract logs
          }
        }
      }

      // Create transaction record
      const transaction = new Transaction({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        type: 'market_listing',
        from: req.user.walletAddress,
        amount: parseInt(amount),
        pricePerToken: priceInWei.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: (receipt.gasUsed * (tx.gasPrice || 0n)).toString(),
        status: 'confirmed',
        confirmations: 1,
        marketListingId: listingId,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          }
        }
      });

      await transaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'market_listing_created',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Marketplace listing created for ${amount} H2 credits`,
          metadata: {
            listingId,
            amount: parseInt(amount),
            pricePerToken: pricePerToken.toString(),
            totalValue: (parseInt(amount) * parseFloat(pricePerToken)).toString(),
            transactionHash: tx.hash
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
        }
      });

      res.status(201).json({
        message: 'Marketplace listing created successfully',
        listingId,
        transactionHash: tx.hash,
        amount: parseInt(amount),
        pricePerToken: pricePerToken.toString(),
        totalValue: (parseInt(amount) * parseFloat(pricePerToken)).toString(),
        status: 'active'
      });

    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create marketplace listing' });
    }
  }
);

// @route   GET /api/marketplace/listings
// @desc    Get marketplace listings
// @access  Private
router.get('/listings', async (req, res) => {
  try {
    const { 
      active = 'true', 
      seller, 
      minPrice, 
      maxPrice, 
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { type: 'market_listing' };
    
    if (active === 'true') {
      query.status = 'confirmed';
    }
    
    if (seller) {
      query.from = seller.toLowerCase();
    }

    // Get listings from database
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .populate('from', 'name organizationName')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    // Get current blockchain state for each listing
    const listingsWithDetails = await Promise.all(
      transactions.map(async (tx) => {
        try {
          if (tx.marketListingId !== null && tx.marketListingId !== undefined) {
            const listingDetails = await blockchainService.contract.getMarketListing(tx.marketListingId);
            
            // Convert price from wei to ETH for display
            const priceInEth = ethers.formatEther(listingDetails.pricePerToken);
            
            return {
              ...tx.toPublicJSON(),
              blockchainData: {
                listingId: tx.marketListingId,
                seller: listingDetails.seller,
                amount: Number(listingDetails.amount),
                pricePerToken: priceInEth,
                active: listingDetails.active,
                timestamp: Number(listingDetails.timestamp),
                totalValue: (Number(listingDetails.amount) * parseFloat(priceInEth)).toFixed(4)
              }
            };
          }
          return tx.toPublicJSON();
        } catch (error) {
          console.error('Failed to get blockchain data for listing:', error);
          return tx.toPublicJSON();
        }
      })
    );

    // Filter by price if specified
    let filteredListings = listingsWithDetails;
    if (minPrice || maxPrice) {
      filteredListings = listingsWithDetails.filter(listing => {
        if (!listing.blockchainData) return true;
        const price = parseFloat(listing.blockchainData.pricePerToken);
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    res.json({
      listings: filteredListings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({ error: 'Failed to get marketplace listings' });
  }
});

// @route   POST /api/marketplace/purchase
// @desc    Purchase credits from marketplace
// @access  Private (Buyers and Producers)
router.post('/purchase',
  authorizeRole(['buyer', 'producer']),
  validatePurchase,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { listingId, amount } = req.body;

      if (!req.user.isVerified) {
        return res.status(403).json({ 
          error: 'Account must be verified to purchase credits' 
        });
      }

      // Get listing details from blockchain
      const listingDetails = await blockchainService.contract.getMarketListing(listingId);
      
      if (!listingDetails.active) {
        return res.status(400).json({ error: 'Listing is not active' });
      }

      if (listingDetails.amount < amount) {
        return res.status(400).json({ 
          error: 'Insufficient amount available',
          available: Number(listingDetails.amount),
          requested: amount
        });
      }

      if (listingDetails.seller.toLowerCase() === req.user.walletAddress.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot purchase your own listing' });
      }

      // Calculate total cost
      const totalCost = BigInt(listingDetails.pricePerToken) * BigInt(amount);

      // Submit purchase to blockchain
      const tx = await blockchainService.purchaseCredits(listingId, amount, totalCost.toString());

      // Wait for confirmation
      const receipt = await tx.wait();

      // Create transaction record
      const transaction = new Transaction({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        type: 'market_purchase',
        from: req.user.walletAddress,
        to: listingDetails.seller,
        amount: parseInt(amount),
        value: totalCost.toString(),
        pricePerToken: listingDetails.pricePerToken.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: (receipt.gasUsed * (tx.gasPrice || 0n)).toString(),
        status: 'confirmed',
        confirmations: 1,
        marketListingId: listingId,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          },
          seller: listingDetails.seller
        }
      });

      await transaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'market_purchase',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        target: {
          walletAddress: listingDetails.seller
        },
        details: {
          description: `Purchased ${amount} H2 credits from marketplace`,
          metadata: {
            listingId,
            amount: parseInt(amount),
            pricePerToken: ethers.formatEther(listingDetails.pricePerToken),
            totalCost: ethers.formatEther(totalCost),
            seller: listingDetails.seller,
            transactionHash: tx.hash
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
        }
      });

      res.json({
        message: 'Credits purchased successfully',
        transactionHash: tx.hash,
        listingId,
        amount: parseInt(amount),
        pricePerToken: ethers.formatEther(listingDetails.pricePerToken),
        totalCost: ethers.formatEther(totalCost),
        seller: listingDetails.seller
      });

    } catch (error) {
      console.error('Purchase credits error:', error);
      res.status(500).json({ error: 'Failed to purchase credits' });
    }
  }
);

// @route   POST /api/marketplace/retire
// @desc    Retire credits for compliance
// @access  Private (Buyers primarily)
router.post('/retire',
  authorizeRole(['buyer', 'producer']),
  [
    body('amount')
      .isNumeric()
      .custom(value => value > 0)
      .withMessage('Amount must be a positive number'),
    body('reason')
      .notEmpty()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters')
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

      const { amount, reason } = req.body;

      // Check user's balance
      const balance = await blockchainService.getBalance(req.user.walletAddress);
      if (balance < amount) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          balance: balance.toString(),
          requested: amount.toString()
        });
      }

      // Submit retirement to blockchain
      const tx = await blockchainService.retireCredits(parseInt(amount), reason);

      // Wait for confirmation
      const receipt = await tx.wait();

      // Create transaction record
      const transaction = new Transaction({
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        type: 'credit_retirement',
        from: req.user.walletAddress,
        amount: parseInt(amount),
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
          retirementReason: reason
        }
      });

      await transaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'credit_retirement',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Retired ${amount} H2 credits for compliance`,
          metadata: {
            amount: parseInt(amount),
            reason,
            transactionHash: tx.hash,
            retirementDate: new Date()
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
        compliance: {
          regulation: 'Green Hydrogen Compliance',
          requirement: 'Credit Retirement',
          evidence: `${amount} credits retired: ${reason}`
        }
      });

      res.json({
        message: 'Credits retired successfully',
        transactionHash: tx.hash,
        amount: parseInt(amount),
        reason,
        retirementDate: new Date()
      });

    } catch (error) {
      console.error('Retire credits error:', error);
      res.status(500).json({ error: 'Failed to retire credits' });
    }
  }
);

// @route   GET /api/marketplace/stats
// @desc    Get marketplace statistics
// @access  Private
router.get('/stats', async (req, res) => {
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

    const stats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom, $lte: now },
          type: { $in: ['market_listing', 'market_purchase', 'credit_retirement'] },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalValue: { 
            $sum: { 
              $multiply: [
                '$amount', 
                { $divide: [{ $toDouble: '$pricePerToken' }, Math.pow(10, 18)] }
              ]
            }
          },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      period,
      dateFrom,
      dateTo: now,
      listings: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0
      },
      purchases: {
        total: 0,
        totalAmount: 0,
        totalValue: 0,
        avgAmount: 0
      },
      retirements: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0
      }
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'market_listing':
          formattedStats.listings = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
        case 'market_purchase':
          formattedStats.purchases = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            totalValue: parseFloat((stat.totalValue || 0).toFixed(4)),
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
        case 'credit_retirement':
          formattedStats.retirements = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
      }
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({ error: 'Failed to get marketplace statistics' });
  }
});

module.exports = router;