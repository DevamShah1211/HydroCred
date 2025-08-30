const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'user_registration',
      'user_verification',
      'role_change',
      'production_request',
      'production_certification',
      'credit_minting',
      'market_listing_created',
      'market_purchase',
      'credit_retirement',
      'admin_action',
      'system_event',
      'security_event',
      'data_export',
      'configuration_change'
    ]
  },
  
  // Actor information
  actor: {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      required: true
    },
    name: String
  },
  
  // Target information (if applicable)
  target: {
    walletAddress: {
      type: String,
      lowercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    name: String
  },
  
  // Resource affected
  resource: {
    type: {
      type: String,
      enum: ['user', 'transaction', 'production_request', 'market_listing', 'system', 'contract']
    },
    id: String, // Can be ObjectId, transaction hash, or other identifier
    name: String
  },
  
  // Action details
  details: {
    description: {
      type: String,
      required: true
    },
    
    // Previous state (for changes)
    previousState: mongoose.Schema.Types.Mixed,
    
    // New state (for changes)
    newState: mongoose.Schema.Types.Mixed,
    
    // Additional metadata
    metadata: {
      amount: Number,
      transactionHash: String,
      blockNumber: Number,
      requestId: String,
      listingId: Number,
      reason: String,
      approvalRequired: Boolean,
      approved: Boolean,
      approvedBy: String
    }
  },
  
  // Request information
  request: {
    method: String, // HTTP method
    endpoint: String, // API endpoint
    userAgent: String,
    ipAddress: String,
    sessionId: String
  },
  
  // Geographic information
  location: {
    country: String,
    state: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Result and status
  result: {
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success'
    },
    errorCode: String,
    errorMessage: String,
    responseTime: Number // in milliseconds
  },
  
  // Security flags
  security: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    flags: [String], // Array of security flags
    requiresReview: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  
  // Compliance tracking
  compliance: {
    regulation: String, // Which regulation this relates to
    requirement: String, // Specific requirement
    evidence: String, // Evidence or proof
    retentionPeriod: Number, // Days to retain this log
    archived: {
      type: Boolean,
      default: false
    }
  },
  
  // Blockchain correlation
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    contractAddress: String,
    eventName: String,
    eventData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and compliance
auditLogSchema.index({ 'actor.walletAddress': 1 });
auditLogSchema.index({ 'target.walletAddress': 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ 'result.status': 1 });
auditLogSchema.index({ 'security.riskLevel': 1 });
auditLogSchema.index({ 'security.requiresReview': 1 });
auditLogSchema.index({ 'blockchain.transactionHash': 1 });

// Compound indexes
auditLogSchema.index({ 'actor.walletAddress': 1, action: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'location.country': 1, 'location.state': 1, 'location.city': 1 });

// TTL index for automatic cleanup (optional - can be configured per regulation)
auditLogSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 7 * 365 * 24 * 60 * 60, // 7 years default
  partialFilterExpression: { 'compliance.archived': true }
});

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toISOString();
});

// Methods
auditLogSchema.methods.flagForReview = function(reason, riskLevel = 'medium') {
  this.security.requiresReview = true;
  this.security.riskLevel = riskLevel;
  this.security.flags.push(reason);
  return this.save();
};

auditLogSchema.methods.markReviewed = function(reviewerId, notes) {
  this.security.reviewedBy = reviewerId;
  this.security.reviewedAt = new Date();
  this.security.reviewNotes = notes;
  this.security.requiresReview = false;
  return this.save();
};

auditLogSchema.methods.archive = function() {
  this.compliance.archived = true;
  return this.save();
};

auditLogSchema.methods.toExportFormat = function() {
  const log = this.toObject();
  
  return {
    timestamp: log.createdAt.toISOString(),
    action: log.action,
    actor: log.actor.walletAddress,
    actorRole: log.actor.role,
    target: log.target?.walletAddress || 'N/A',
    description: log.details.description,
    status: log.result.status,
    location: `${log.location?.city || ''}, ${log.location?.state || ''}, ${log.location?.country || ''}`.trim(),
    transactionHash: log.blockchain?.transactionHash || 'N/A',
    riskLevel: log.security.riskLevel
  };
};

// Static methods
auditLogSchema.statics.createLog = function(logData) {
  // Auto-populate common fields
  const log = new this({
    ...logData,
    createdAt: new Date()
  });
  
  // Auto-determine risk level based on action
  if (!log.security.riskLevel) {
    const highRiskActions = ['role_change', 'admin_action', 'security_event'];
    const mediumRiskActions = ['user_verification', 'production_certification', 'credit_minting'];
    
    if (highRiskActions.includes(log.action)) {
      log.security.riskLevel = 'high';
    } else if (mediumRiskActions.includes(log.action)) {
      log.security.riskLevel = 'medium';
    }
  }
  
  return log.save();
};

auditLogSchema.statics.findByUser = function(walletAddress, options = {}) {
  const query = {
    $or: [
      { 'actor.walletAddress': walletAddress.toLowerCase() },
      { 'target.walletAddress': walletAddress.toLowerCase() }
    ]
  };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.dateFrom && options.dateTo) {
    query.createdAt = {
      $gte: options.dateFrom,
      $lte: options.dateTo
    };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

auditLogSchema.statics.getComplianceReport = function(dateFrom, dateTo, filters = {}) {
  const matchStage = {
    createdAt: {
      $gte: dateFrom,
      $lte: dateTo
    }
  };
  
  if (filters.action) {
    matchStage.action = filters.action;
  }
  
  if (filters.riskLevel) {
    matchStage['security.riskLevel'] = filters.riskLevel;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          action: '$action',
          riskLevel: '$security.riskLevel',
          status: '$result.status'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$result.responseTime' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

auditLogSchema.statics.findSecurityEvents = function(riskLevel = 'high', limit = 50) {
  return this.find({
    'security.riskLevel': { $in: Array.isArray(riskLevel) ? riskLevel : [riskLevel] },
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

auditLogSchema.statics.exportLogs = function(filters = {}, format = 'json') {
  const query = {};
  
  if (filters.dateFrom && filters.dateTo) {
    query.createdAt = {
      $gte: filters.dateFrom,
      $lte: filters.dateTo
    };
  }
  
  if (filters.action) {
    query.action = filters.action;
  }
  
  if (filters.walletAddress) {
    query.$or = [
      { 'actor.walletAddress': filters.walletAddress.toLowerCase() },
      { 'target.walletAddress': filters.walletAddress.toLowerCase() }
    ];
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 10000);
};

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Normalize wallet addresses
  if (this.actor?.walletAddress) {
    this.actor.walletAddress = this.actor.walletAddress.toLowerCase();
  }
  if (this.target?.walletAddress) {
    this.target.walletAddress = this.target.walletAddress.toLowerCase();
  }
  
  // Set retention period based on action type if not specified
  if (!this.compliance.retentionPeriod) {
    const longTermActions = ['production_certification', 'credit_minting', 'credit_retirement'];
    this.compliance.retentionPeriod = longTermActions.includes(this.action) ? 
      10 * 365 : 7 * 365; // 10 years for critical actions, 7 years for others
  }
  
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);