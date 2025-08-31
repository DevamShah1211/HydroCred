import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { getCreditEvents } from '../lib/chain';
import { encrypt, hash } from '../lib/crypto';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'HydroCred Backend API'
  });
});

// File upload endpoint
router.post('/upload', upload.single('document'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileMetadata = {
      id: hash(req.file.filename),
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      // Placeholder for future IPFS integration
      ipfsHash: null,
      encryptedPath: encrypt(req.file.path)
    };

    res.json({
      success: true,
      file: fileMetadata
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get ledger data (blockchain events)
router.get('/ledger', async (req: Request, res: Response) => {
  try {
    const fromBlockSchema = z.object({
      fromBlock: z.string().optional().transform(val => val ? parseInt(val) : 0)
    });
    
    const { fromBlock } = fromBlockSchema.parse(req.query);
    
    const events = await getCreditEvents(fromBlock);
    
    res.json({
      success: true,
      events,
      count: events.length,
      fromBlock
    });
  } catch (error) {
    console.error('Ledger fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ledger data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific token information
router.get('/token/:tokenId', async (req: Request, res: Response) => {
  try {
    const tokenIdSchema = z.object({
      tokenId: z.string().transform(val => parseInt(val))
    });
    
    const { tokenId } = tokenIdSchema.parse(req.params);
    
    // This would fetch token metadata from IPFS in the future
    res.json({
      success: true,
      tokenId,
      metadata: {
        // Placeholder metadata
        name: `HydroCred Token #${tokenId}`,
        description: 'Green Hydrogen Production Credit',
        attributes: [
          { trait_type: 'Type', value: 'Green Hydrogen Credit' },
          { trait_type: 'Unit', value: '1 verified unit' }
        ]
      }
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(400).json({ error: 'Invalid token ID' });
  }
});

// Get verified producers directory (public endpoint)
router.get('/producers', async (req: Request, res: Response) => {
  try {
    const { getVerifiedProducers } = await import('../lib/chain');
    const producers = await getVerifiedProducers();
    
    res.json({
      success: true,
      producers,
      count: producers.length
    });
  } catch (error) {
    console.error('Producers fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch producers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit credit request from buyer to producer
router.post('/credit-requests', async (req: Request, res: Response) => {
  try {
    const requestSchema = z.object({
      producerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      buyerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      requestedAmount: z.number().min(1).max(1000),
      purpose: z.string().min(1),
      deliveryDate: z.string(),
      contactInfo: z.string().min(1),
      message: z.string().optional()
    });
    
    const requestData = requestSchema.parse(req.body);
    
    // In a real implementation, this would be stored in a database
    // For now, we'll just log it and return success
    console.log('📝 New credit request received:', {
      ...requestData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    res.json({
      success: true,
      message: 'Credit request submitted successfully',
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Credit request error:', error);
    res.status(400).json({ 
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get credit requests for a producer
router.get('/credit-requests/:producerAddress', async (req: Request, res: Response) => {
  try {
    const { producerAddress } = req.params;
    
    // In a real implementation, this would query a database
    // For now, return sample data
    const sampleRequests = [
      {
        id: 'req_1',
        buyerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        requestedAmount: 5,
        purpose: 'steel-production',
        deliveryDate: '2024-02-15',
        contactInfo: 'steel@company.com',
        message: 'Need credits for our Q1 steel production',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      requests: sampleRequests,
      count: sampleRequests.length
    });
  } catch (error) {
    console.error('Credit requests fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credit requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;