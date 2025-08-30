import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      walletAddress?: string;
    }
  }
}

export const authenticateWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signature, message, walletAddress } = req.headers;

    if (!signature || !message || !walletAddress) {
      return res.status(401).json({
        error: 'Missing authentication headers',
        required: ['signature', 'message', 'walletAddress']
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message as string, signature as string);
    
    if (recoveredAddress.toLowerCase() !== (walletAddress as string).toLowerCase()) {
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'Signature does not match wallet address'
      });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress as string });
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Please complete onboarding first'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'User not verified',
        message: 'Your account is pending verification by an admin'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Attach user to request
    req.user = user;
    req.walletAddress = walletAddress as string;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

export const requireAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const adminRoles = ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'];
  
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Only admin users can access this endpoint',
      userRole: req.user.role
    });
  }

  next();
};

export const requireProducerRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'PRODUCER') {
    return res.status(403).json({
      error: 'Producer access required',
      message: 'Only producers can access this endpoint',
      userRole: req.user.role
    });
  }

  next();
};

export const requireBuyerRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'BUYER') {
    return res.status(403).json({
      error: 'Buyer access required',
      message: 'Only buyers can access this endpoint',
      userRole: req.user.role
    });
  }

  next();
};

export const requireAuditorRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'AUDITOR') {
    return res.status(403).json({
      error: 'Auditor access required',
      message: 'Only auditors can access this endpoint',
      userRole: req.user.role
    });
  }

  next();
};

export const requireHigherAdminRole = (targetRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    let canAppoint = false;

    switch (targetRole) {
      case 'STATE_ADMIN':
        canAppoint = userRole === 'COUNTRY_ADMIN';
        break;
      case 'CITY_ADMIN':
        canAppoint = userRole === 'COUNTRY_ADMIN' || userRole === 'STATE_ADMIN';
        break;
      case 'PRODUCER':
      case 'BUYER':
      case 'AUDITOR':
        canAppoint = ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(userRole);
        break;
      default:
        canAppoint = false;
    }

    if (!canAppoint) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Cannot appoint ${targetRole} role`,
        userRole: userRole,
        targetRole: targetRole
      });
    }

    next();
  };
};