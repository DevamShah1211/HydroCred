const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Blockchain transaction details
  txHash: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{64}$/.test(v);
      },
      message: 'Invalid transaction hash format'
    }
  },
  
  blockNumber: {
    type: Number,
    required: true
  },
  
  blockHash: {
    type: String,
    required: true
  },

  // Transaction type and details
  type: {
    type: String,
    required: true,
    enum: [
      'production_request',
      'production_certification',
      'credit_minting',
      'market_listing',
      'market_purchase',
      'credit_retirement',
      'role_assignment'
    ]
  },

  // Participants
  from: {
    type: String,
    required: true,
    lowercase: true
  },
  
  to: {
    type: String,
    lowercase: true
  },

  // Amount and value
  amount: {
    type: Number,
    required: function() {
      return ['credit_minting', 'market_purchase', 'credit_retirement'].includes(this.type);
    }
  },
  
  value: {
    type: String, // Wei amount as string
    default: '0'
  },
  
  pricePerToken: {
    type: String, // Wei amount as string
    required: function() {
      return ['market_listing', 'market_purchase'].includes(this.type);
    }
  },

  // Gas information
  gasUsed: {
    type: Number,
    required: true
  },
  
  gasPrice: {
    type: String, // Wei as string
    required: true
  },
  
  gasFee: {
    type: String, // Wei as string
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  
  confirmations: {
    type: Number,
    default: 0
  },

  // Associated data
  productionRequestId: {
    type: String, // bytes32 as hex string
    required: function() {
      return ['production_request', 'production_certification', 'credit_minting'].includes(this.type);
    }
  },
  
  marketListingId: {
    type: Number,
    required: function() {
      return ['market_listing', 'market_purchase'].includes(this.type);
    }
  },

  // Production-specific data
  productionData: {
    facilityId: String,
    productionMethod: String,
    energySource: String,
    productionDate: Date,
    qualityMetrics: {
      purity: Number,
      pressure: Number,
      temperature: Number
    },
    certificationStandard: String
  },

  // Document references
  proofDocuments: [{
    filename: String,
    hash: String,
    uploadDate: Date,
    size: Number
  }],

  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      state: String,
      city: String
    }
  },

  // Audit trail
  events: [{
    event: String,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }],

  // Error information (for failed transactions)
  errorReason: {
    type: String
  },
  
  errorCode: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ from: 1 });
transactionSchema.index({ to: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ blockNumber: -1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ productionRequestId: 1 });
transactionSchema.index({ marketListingId: 1 });

// Compound indexes
transactionSchema.index({ from: 1, type: 1, createdAt: -1 });
transactionSchema.index({ to: 1, type: 1, createdAt: -1 });

// Virtual for gas fee in ETH
transactionSchema.virtual('gasFeeEth').get(function() {
  return this.gasFee ? (parseFloat(this.gasFee) / 1e18).toFixed(6) : '0';
});

// Virtual for value in ETH
transactionSchema.virtual('valueEth').get(function() {
  return this.value ? (parseFloat(this.value) / 1e18).toFixed(6) : '0';
});

// Methods
transactionSchema.methods.addEvent = function(event, data = {}) {
  this.events.push({
    event,
    timestamp: new Date(),
    data
  });
  return this.save();
};

transactionSchema.methods.updateStatus = function(status, confirmations = 0) {
  this.status = status;
  this.confirmations = confirmations;
  
  this.addEvent(`status_changed_to_${status}`, {
    confirmations,
    timestamp: new Date()
  });
  
  return this.save();
};

transactionSchema.methods.toPublicJSON = function() {
  const transaction = this.toObject();
  
  // Remove sensitive metadata
  if (transaction.metadata) {
    delete transaction.metadata.ipAddress;
    delete transaction.metadata.userAgent;
  }
  
  delete transaction.__v;
  return transaction;
};

// Static methods
transactionSchema.statics.findByUser = function(walletAddress, options = {}) {
  const query = {
    $or: [
      { from: walletAddress.toLowerCase() },
      { to: walletAddress.toLowerCase() }
    ]
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

transactionSchema.statics.getAnalytics = function(dateFrom, dateTo, filters = {}) {
  const matchStage = {
    createdAt: {
      $gte: dateFrom,
      $lte: dateTo
    },
    status: 'confirmed'
  };
  
  if (filters.type) {
    matchStage.type = filters.type;
  }
  
  if (filters.location) {
    if (filters.location.country) {
      matchStage['metadata.location.country'] = filters.location.country;
    }
    if (filters.location.state) {
      matchStage['metadata.location.state'] = filters.location.state;
    }
    if (filters.location.city) {
      matchStage['metadata.location.city'] = filters.location.city;
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$type',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalValue: { $sum: { $toDouble: '$value' } },
        avgGasFee: { $avg: { $toDouble: '$gasFee' } }
      }
    },
    { $sort: { '_id.date': -1, '_id.type': 1 } }
  ]);
};

transactionSchema.statics.findPendingTransactions = function() {
  return this.find({ 
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ createdAt: 1 });
};

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Normalize addresses
  if (this.from) {
    this.from = this.from.toLowerCase();
  }
  if (this.to) {
    this.to = this.to.toLowerCase();
  }
  
  // Calculate gas fee if not provided
  if (this.gasUsed && this.gasPrice && !this.gasFee) {
    this.gasFee = (BigInt(this.gasUsed) * BigInt(this.gasPrice)).toString();
  }
  
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);