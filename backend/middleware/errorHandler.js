const AuditLog = require('../models/AuditLog');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Ethereum/Web3 errors
  if (err.code === 'CALL_EXCEPTION') {
    const message = 'Smart contract call failed';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'INSUFFICIENT_FUNDS') {
    const message = 'Insufficient funds for transaction';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'NONCE_EXPIRED') {
    const message = 'Transaction nonce expired';
    error = { message, statusCode: 400 };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.type === 'entity.too.large') {
    const message = 'Request body too large';
    error = { message, statusCode: 413 };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Log critical errors to audit log
  if (statusCode >= 500 && req.user) {
    AuditLog.createLog({
      action: 'system_event',
      actor: {
        walletAddress: req.user.walletAddress,
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name
      },
      details: {
        description: `Server error: ${message}`,
        metadata: {
          errorName: err.name,
          errorCode: err.code,
          stack: err.stack?.substring(0, 500), // Truncate stack trace
          endpoint: req.path,
          method: req.method
        }
      },
      request: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      },
      security: {
        riskLevel: 'high',
        flags: ['server_error']
      },
      result: {
        status: 'failure',
        errorCode: err.code || 'INTERNAL_SERVER_ERROR'
      }
    }).catch(console.error);
  }

  // Send error response
  const response = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = {
      name: err.name,
      code: err.code,
      originalError: err
    };
  }

  // Include request ID if available
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;