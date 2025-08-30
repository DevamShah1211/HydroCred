import mongoose, { Document, Schema } from 'mongoose';

export interface IProductionRequest extends Document {
  requestId: number;
  producer: mongoose.Types.ObjectId;
  producerWallet: string;
  amount: number; // in kg
  proofHash: string;
  proofDocuments?: string[]; // URLs or IPFS hashes
  status: 'PENDING' | 'CERTIFIED' | 'REJECTED' | 'TOKENS_MINTED';
  certifiedBy?: mongoose.Types.ObjectId;
  certifiedByWallet?: string;
  certifiedAt?: Date;
  rejectionReason?: string;
  tokensMinted: boolean;
  mintedAt?: Date;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productionRequestSchema = new Schema<IProductionRequest>({
  requestId: {
    type: Number,
    required: true,
    unique: true,
    auto: true
  },
  producer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  producerWallet: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.1, // Minimum 0.1 kg
    max: 1000000 // Maximum 1,000,000 kg
  },
  proofHash: {
    type: String,
    required: true,
    trim: true
  },
  proofDocuments: [{
    type: String,
    required: false,
    trim: true
  }],
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'CERTIFIED', 'REJECTED', 'TOKENS_MINTED'],
    default: 'PENDING'
  },
  certifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  certifiedByWallet: {
    type: String,
    required: false,
    lowercase: true
  },
  certifiedAt: {
    type: Date,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  tokensMinted: {
    type: Boolean,
    default: false
  },
  mintedAt: {
    type: Date,
    required: false
  },
  blockchainTxHash: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productionRequestSchema.index({ producer: 1 });
productionRequestSchema.index({ status: 1 });
productionRequestSchema.index({ certifiedBy: 1 });
productionRequestSchema.index({ createdAt: 1 });
productionRequestSchema.index({ producerWallet: 1 });

// Virtual for formatted amount
productionRequestSchema.virtual('amountFormatted').get(function(this: IProductionRequest) {
  return `${this.amount.toLocaleString()} kg`;
});

// Virtual for status color (for UI)
productionRequestSchema.virtual('statusColor').get(function(this: IProductionRequest) {
  switch (this.status) {
    case 'PENDING':
      return 'yellow';
    case 'CERTIFIED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'TOKENS_MINTED':
      return 'blue';
    default:
      return 'gray';
  }
});

// Pre-save middleware to update status based on certification
productionRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'CERTIFIED' && !this.certifiedAt) {
    this.certifiedAt = new Date();
  }
  
  if (this.isModified('tokensMinted') && this.tokensMinted && !this.mintedAt) {
    this.mintedAt = new Date();
  }
  
  next();
});

// Static method to get pending requests for a certifier
productionRequestSchema.statics.getPendingForCertifier = function(certifierId: mongoose.Types.ObjectId) {
  return this.find({ status: 'PENDING' }).populate('producer', 'username organization');
};

// Static method to get requests by producer
productionRequestSchema.statics.getByProducer = function(producerId: mongoose.Types.ObjectId) {
  return this.find({ producer: producerId }).populate('certifiedBy', 'username role');
};

// Static method to get certified requests
productionRequestSchema.statics.getCertified = function() {
  return this.find({ status: 'CERTIFIED' }).populate('producer', 'username organization');
};

// Instance method to certify the request
productionRequestSchema.methods.certify = function(certifierId: mongoose.Types.ObjectId, certifierWallet: string) {
  this.status = 'CERTIFIED';
  this.certifiedBy = certifierId;
  this.certifiedByWallet = certifierWallet;
  this.certifiedAt = new Date();
  return this.save();
};

// Instance method to reject the request
productionRequestSchema.methods.reject = function(reason: string) {
  this.status = 'REJECTED';
  this.rejectionReason = reason;
  return this.save();
};

// Instance method to mark tokens as minted
productionRequestSchema.methods.markTokensMinted = function(txHash: string) {
  this.status = 'TOKENS_MINTED';
  this.tokensMinted = true;
  this.blockchainTxHash = txHash;
  this.mintedAt = new Date();
  return this.save();
};

export default mongoose.model<IProductionRequest>('ProductionRequest', productionRequestSchema);