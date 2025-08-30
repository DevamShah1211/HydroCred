import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ethers } from 'ethers';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import producerRoutes from './routes/producer';
import buyerRoutes from './routes/buyer';
import auditRoutes from './routes/audit';
import marketplaceRoutes from './routes/marketplace';

// Import middleware
import { authenticateWallet } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Import models
import './models/User';
import './models/ProductionRequest';
import './models/Transaction';
import './models/AuditLog';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5055;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'HydroCred Backend API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticateWallet, adminRoutes);
app.use('/api/producer', authenticateWallet, producerRoutes);
app.use('/api/buyer', authenticateWallet, buyerRoutes);
app.use('/api/audit', authenticateWallet, auditRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hydrocred')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 HydroCred Backend API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

export default app;