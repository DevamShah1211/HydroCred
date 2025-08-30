const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const blockchainService = require('../config/blockchain');
const { authorizeRole, verifyWalletSignature } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/production');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const hash = crypto.createHash('sha256').update(file.originalname + uniqueSuffix).digest('hex').substring(0, 16);
    cb(null, `${hash}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Validation middleware
const validateProductionRequest = [
  body('amount')
    .isNumeric()
    .custom(value => value > 0)
    .withMessage('Amount must be a positive number'),
  body('productionData.facilityId')
    .notEmpty()
    .withMessage('Facility ID is required'),
  body('productionData.productionMethod')
    .isIn(['electrolysis', 'steam_reforming', 'biomass_gasification', 'other'])
    .withMessage('Invalid production method'),
  body('productionData.energySource')
    .isIn(['solar', 'wind', 'hydro', 'geothermal', 'nuclear', 'grid_renewable', 'other'])
    .withMessage('Invalid energy source'),
  body('productionData.productionDate')
    .isISO8601()
    .withMessage('Invalid production date format'),
  body('productionData.qualityMetrics.purity')
    .optional()
    .isFloat({ min: 90, max: 100 })
    .withMessage('Purity must be between 90-100%'),
  body('productionData.certificationStandard')
    .optional()
    .isIn(['CertifHy', 'ISCC', 'TUV_SUD', 'other'])
    .withMessage('Invalid certification standard')
];

// @route   POST /api/production/request
// @desc    Submit production request for certification
// @access  Private (Producer only)
router.post('/request',
  authorizeRole(['producer']),
  upload.array('proofDocuments', 5),
  validateProductionRequest,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      if (!req.user.isVerified) {
        return res.status(403).json({ 
          error: 'Account must be verified to submit production requests' 
        });
      }

      const { amount, productionData } = req.body;
      
      // Process uploaded files
      const proofDocuments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileBuffer = await fs.readFile(file.path);
          const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          
          proofDocuments.push({
            filename: file.originalname,
            hash: fileHash,
            uploadDate: new Date(),
            size: file.size,
            path: file.path
          });
        }
      }

      // Create proof hash from all documents and production data
      const proofString = JSON.stringify({
        productionData,
        documents: proofDocuments.map(doc => ({ filename: doc.filename, hash: doc.hash })),
        producer: req.user.walletAddress,
        timestamp: Date.now()
      });
      
      const proofHash = crypto.createHash('sha256').update(proofString).digest('hex');

      // Create request ID (same logic as smart contract)
      const requestId = blockchainService.createRequestId(
        req.user.walletAddress,
        parseInt(amount),
        proofHash,
        Math.floor(Date.now() / 1000)
      );

      // Check if request already exists
      const existingTransaction = await Transaction.findOne({ productionRequestId: requestId });
      if (existingTransaction) {
        return res.status(400).json({ error: 'Production request already exists' });
      }

      // Submit to blockchain
      const tx = await blockchainService.requestProduction(
        parseInt(amount),
        JSON.stringify(productionData),
        proofHash
      );

      // Create transaction record
      const transaction = new Transaction({
        txHash: tx.hash,
        blockNumber: 0, // Will be updated when confirmed
        blockHash: '',
        type: 'production_request',
        from: req.user.walletAddress,
        amount: parseInt(amount),
        gasUsed: 0, // Will be updated when confirmed
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: '0',
        status: 'pending',
        productionRequestId: requestId,
        productionData: {
          facilityId: productionData.facilityId,
          productionMethod: productionData.productionMethod,
          energySource: productionData.energySource,
          productionDate: new Date(productionData.productionDate),
          qualityMetrics: productionData.qualityMetrics || {},
          certificationStandard: productionData.certificationStandard
        },
        proofDocuments,
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
        action: 'production_request',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Production request submitted for ${amount} kg of hydrogen`,
          metadata: {
            amount: parseInt(amount),
            requestId,
            transactionHash: tx.hash,
            facilityId: productionData.facilityId,
            productionMethod: productionData.productionMethod,
            energySource: productionData.energySource,
            documentsCount: proofDocuments.length
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
          contractAddress: blockchainService.contractAddress
        }
      });

      res.status(201).json({
        message: 'Production request submitted successfully',
        requestId,
        transactionHash: tx.hash,
        amount: parseInt(amount),
        status: 'pending_certification',
        proofDocuments: proofDocuments.map(doc => ({
          filename: doc.filename,
          hash: doc.hash,
          size: doc.size,
          uploadDate: doc.uploadDate
        }))
      });

    } catch (error) {
      console.error('Production request error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Failed to cleanup file:', unlinkError);
          }
        }
      }
      
      res.status(500).json({ error: 'Failed to submit production request' });
    }
  }
);

// @route   GET /api/production/requests
// @desc    Get production requests (filtered by role)
// @access  Private
router.get('/requests', async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'producer') {
      // Producers see only their own requests
      query.from = req.user.walletAddress;
    } else if (['city_admin', 'state_admin', 'country_admin'].includes(req.user.role)) {
      // Admins see requests in their jurisdiction
      query['metadata.location.country'] = req.user.country;
      
      if (req.user.role === 'state_admin') {
        query['metadata.location.state'] = req.user.state;
      } else if (req.user.role === 'city_admin') {
        query['metadata.location.state'] = req.user.state;
        query['metadata.location.city'] = req.user.city;
      }
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Only show production requests
    query.type = 'production_request';

    const transactions = await Transaction.find(query)
      .populate('from', 'name organizationName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    // Get additional blockchain data for each request
    const requestsWithDetails = await Promise.all(
      transactions.map(async (tx) => {
        try {
          const requestDetails = await blockchainService.contract.getProductionRequest(tx.productionRequestId);
          return {
            ...tx.toPublicJSON(),
            blockchainData: {
              certified: requestDetails.certified,
              minted: requestDetails.minted,
              certifier: requestDetails.certifier,
              timestamp: Number(requestDetails.timestamp)
            }
          };
        } catch (error) {
          console.error('Failed to get blockchain data for request:', error);
          return tx.toPublicJSON();
        }
      })
    );

    res.json({
      requests: requestsWithDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get production requests error:', error);
    res.status(500).json({ error: 'Failed to get production requests' });
  }
});

// @route   POST /api/production/certify/:requestId
// @desc    Certify a production request (City Admin only)
// @access  Private (City Admin only)
router.post('/certify/:requestId',
  authorizeRole(['city_admin']),
  verifyWalletSignature,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Find the production request transaction
      const transaction = await Transaction.findOne({ 
        productionRequestId: requestId,
        type: 'production_request'
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Production request not found' });
      }

      // Check if admin is in the same jurisdiction as the producer
      if (transaction.metadata.location.country !== req.user.country ||
          transaction.metadata.location.state !== req.user.state ||
          transaction.metadata.location.city !== req.user.city) {
        return res.status(403).json({ 
          error: 'Can only certify requests from your jurisdiction' 
        });
      }

      // Check if already certified
      try {
        const requestDetails = await blockchainService.contract.getProductionRequest(requestId);
        if (requestDetails.certified) {
          return res.status(400).json({ error: 'Request already certified' });
        }
      } catch (blockchainError) {
        console.error('Blockchain check error:', blockchainError);
        return res.status(500).json({ error: 'Failed to verify request status' });
      }

      // Submit certification to blockchain
      const tx = await blockchainService.certifyProduction(requestId);

      // Create certification transaction record
      const certificationTransaction = new Transaction({
        txHash: tx.hash,
        blockNumber: 0,
        blockHash: '',
        type: 'production_certification',
        from: req.user.walletAddress,
        to: transaction.from,
        gasUsed: 0,
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: '0',
        status: 'pending',
        productionRequestId: requestId,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          },
          originalRequestHash: transaction.txHash
        }
      });

      await certificationTransaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'production_certification',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        target: {
          walletAddress: transaction.from
        },
        details: {
          description: `Production request certified for ${transaction.amount} kg of hydrogen`,
          metadata: {
            requestId,
            amount: transaction.amount,
            transactionHash: tx.hash,
            originalRequestHash: transaction.txHash,
            certificationDate: new Date()
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
          contractAddress: blockchainService.contractAddress
        },
        security: {
          riskLevel: 'medium'
        }
      });

      res.json({
        message: 'Production request certified successfully',
        requestId,
        certificationHash: tx.hash,
        certifier: req.user.walletAddress,
        amount: transaction.amount
      });

    } catch (error) {
      console.error('Certification error:', error);
      res.status(500).json({ error: 'Failed to certify production request' });
    }
  }
);

// @route   POST /api/production/mint/:requestId
// @desc    Mint credits for certified production (Producer only)
// @access  Private (Producer only)
router.post('/mint/:requestId',
  authorizeRole(['producer']),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Find the production request transaction
      const transaction = await Transaction.findOne({ 
        productionRequestId: requestId,
        type: 'production_request',
        from: req.user.walletAddress
      });

      if (!transaction) {
        return res.status(404).json({ error: 'Production request not found or not yours' });
      }

      // Check blockchain status
      try {
        const requestDetails = await blockchainService.contract.getProductionRequest(requestId);
        
        if (!requestDetails.certified) {
          return res.status(400).json({ error: 'Request not yet certified' });
        }
        
        if (requestDetails.minted) {
          return res.status(400).json({ error: 'Credits already minted' });
        }
      } catch (blockchainError) {
        console.error('Blockchain check error:', blockchainError);
        return res.status(500).json({ error: 'Failed to verify request status' });
      }

      // Submit minting to blockchain
      const tx = await blockchainService.mintCredits(requestId);

      // Create minting transaction record
      const mintingTransaction = new Transaction({
        txHash: tx.hash,
        blockNumber: 0,
        blockHash: '',
        type: 'credit_minting',
        from: req.user.walletAddress,
        amount: transaction.amount,
        gasUsed: 0,
        gasPrice: tx.gasPrice?.toString() || '0',
        gasFee: '0',
        status: 'pending',
        productionRequestId: requestId,
        metadata: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: {
            country: req.user.country,
            state: req.user.state,
            city: req.user.city
          },
          originalRequestHash: transaction.txHash
        }
      });

      await mintingTransaction.save();

      // Create audit log
      await AuditLog.createLog({
        action: 'credit_minting',
        actor: {
          walletAddress: req.user.walletAddress,
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name
        },
        details: {
          description: `Credits minted for ${transaction.amount} kg of certified hydrogen`,
          metadata: {
            requestId,
            amount: transaction.amount,
            transactionHash: tx.hash,
            originalRequestHash: transaction.txHash,
            mintingDate: new Date()
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
          contractAddress: blockchainService.contractAddress
        }
      });

      res.json({
        message: 'Credits minted successfully',
        requestId,
        mintingHash: tx.hash,
        amount: transaction.amount,
        recipient: req.user.walletAddress
      });

    } catch (error) {
      console.error('Minting error:', error);
      res.status(500).json({ error: 'Failed to mint credits' });
    }
  }
);

// @route   GET /api/production/stats
// @desc    Get production statistics
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

    // Build query based on user role
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
    } else if (req.user.role === 'producer') {
      locationFilter = {
        from: req.user.walletAddress
      };
    }

    const stats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom, $lte: now },
          type: { $in: ['production_request', 'production_certification', 'credit_minting'] },
          ...locationFilter
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Format stats
    const formattedStats = {
      period,
      dateFrom,
      dateTo: now,
      requests: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0
      },
      certifications: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0
      },
      minted: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0
      }
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'production_request':
          formattedStats.requests = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
        case 'production_certification':
          formattedStats.certifications = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
        case 'credit_minting':
          formattedStats.minted = {
            total: stat.count,
            totalAmount: stat.totalAmount || 0,
            avgAmount: Math.round(stat.avgAmount || 0)
          };
          break;
      }
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get production stats error:', error);
    res.status(500).json({ error: 'Failed to get production statistics' });
  }
});

module.exports = router;