import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { getCreditEvents, batchIssueCredits, transferCredit, retireCredit, getOwnedTokens, getTokenOwner, isTokenRetired, isCertifier, isAdmin, MockBlockchain } from '../lib/chain';
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
    service: 'HydroCred Backend API',
    mode: process.env.NODE_ENV === 'development' ? 'mock-blockchain' : 'production'
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
    
    // Get token details from blockchain
    const owner = await getTokenOwner(tokenId);
    const isRetired = await isTokenRetired(tokenId);
    
    res.json({
      success: true,
      tokenId,
      owner,
      isRetired,
      metadata: {
        name: `HydroCred Token #${tokenId}`,
        description: 'Green Hydrogen Production Credit',
        attributes: [
          { trait_type: 'Type', value: 'Green Hydrogen Credit' },
          { trait_type: 'Unit', value: '1 verified unit' },
          { trait_type: 'Status', value: isRetired ? 'Retired' : 'Active' }
        ]
      }
    });
  } catch (error) {
    console.error('Token fetch error:', error);
    res.status(400).json({ error: 'Invalid token ID or token not found' });
  }
});

// Mock blockchain operations (development only)
if (process.env.NODE_ENV === 'development') {
  
  // Issue credits
  router.post('/mock/issue', async (req: Request, res: Response) => {
    try {
      const { to, amount, issuedBy } = req.body;
      
      if (!to || !amount || !issuedBy) {
        return res.status(400).json({ error: 'Missing required fields: to, amount, issuedBy' });
      }
      
      const transaction = await batchIssueCredits(to, amount, issuedBy);
      
      res.json({
        success: true,
        transaction,
        message: `Successfully issued ${amount} credits to ${to}`
      });
    } catch (error) {
      console.error('Mock issue error:', error);
      res.status(400).json({ 
        error: 'Failed to issue credits',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Transfer credits
  router.post('/mock/transfer', async (req: Request, res: Response) => {
    try {
      const { from, to, tokenId } = req.body;
      
      if (!from || !to || !tokenId) {
        return res.status(400).json({ error: 'Missing required fields: from, to, tokenId' });
      }
      
      const transaction = await transferCredit(from, to, tokenId);
      
      res.json({
        success: true,
        transaction,
        message: `Successfully transferred token #${tokenId} from ${from} to ${to}`
      });
    } catch (error) {
      console.error('Mock transfer error:', error);
      res.status(400).json({ 
        error: 'Failed to transfer credit',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Retire credits
  router.post('/mock/retire', async (req: Request, res: Response) => {
    try {
      const { tokenId, retiredBy } = req.body;
      
      if (!tokenId || !retiredBy) {
        return res.status(400).json({ error: 'Missing required fields: tokenId, retiredBy' });
      }
      
      const transaction = await retireCredit(tokenId, retiredBy);
      
      res.json({
        success: true,
        transaction,
        message: `Successfully retired token #${tokenId}`
      });
    } catch (error) {
      console.error('Mock retire error:', error);
      res.status(400).json({ 
        error: 'Failed to retire credit',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get owned tokens
  router.get('/mock/tokens/:owner', async (req: Request, res: Response) => {
    try {
      const { owner } = req.params;
      const tokens = await getOwnedTokens(owner);
      
      res.json({
        success: true,
        owner,
        tokens,
        count: tokens.length
      });
    } catch (error) {
      console.error('Mock get tokens error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch owned tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check role
  router.get('/mock/role/:role/:address', async (req: Request, res: Response) => {
    try {
      const { role, address } = req.params;
      let hasRoleResult = false;
      
      if (role === 'certifier') {
        hasRoleResult = await isCertifier(address);
      } else if (role === 'admin') {
        hasRoleResult = await isAdmin(address);
      } else {
        return res.status(400).json({ error: 'Invalid role. Use "certifier" or "admin"' });
      }
      
      res.json({
        success: true,
        address,
        role,
        hasRole: hasRoleResult
      });
    } catch (error) {
      console.error('Mock role check error:', error);
      res.status(500).json({ 
        error: 'Failed to check role',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mock blockchain management
  router.post('/mock/add-certifier', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Missing address field' });
      }
      
      await MockBlockchain.addCertifier(address);
      
      res.json({
        success: true,
        message: `Added ${address} as certifier`
      });
    } catch (error) {
      console.error('Mock add certifier error:', error);
      res.status(500).json({ 
        error: 'Failed to add certifier',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/mock/add-admin', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Missing address field' });
      }
      
      await MockBlockchain.addAdmin(address);
      
      res.json({
        success: true,
        message: `Added ${address} as admin and certifier`
      });
    } catch (error) {
      console.error('Mock add admin error:', error);
      res.status(500).json({ 
        error: 'Failed to add admin',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/mock/reset', async (req: Request, res: Response) => {
    try {
      await MockBlockchain.reset();
      
      res.json({
        success: true,
        message: 'Mock blockchain reset to initial state'
      });
    } catch (error) {
      console.error('Mock reset error:', error);
      res.status(500).json({ 
        error: 'Failed to reset mock blockchain',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/mock/data', async (req: Request, res: Response) => {
    try {
      const data = await MockBlockchain.getMockData();
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Mock get data error:', error);
      res.status(500).json({ 
        error: 'Failed to get mock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default router;