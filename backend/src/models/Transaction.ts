import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  txHash: string;
  type: 'MINT' | 'TRANSFER' | 'SALE' | 'RETIRE';
  from: string;
  to?: string;
  amount: number;
  blockNumber: number;
  gasUsed: number;
  gasPrice: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  confirmedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  txHash: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['MINT', 'TRANSFER', 'SALE', 'RETIRE']
  },
  from: {
    type: String,
    required: true,
    lowercase: true
  },
  to: {
    type: String,
    required: false,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  blockNumber: {
    type: Number,
    required: false
  },
  gasUsed: {
    type: Number,
    required: false
  },
  gasPrice: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING'
  },
  confirmedAt: {
    type: Date,
    required: false
  },
  failedAt: {
    type: Date,
    required: false
  },
  errorMessage: {
    type: String,
    required: false,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ from: 1 });
transactionSchema.index({ to: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: 1 });
transactionSchema.index({ blockNumber: 1 });

// Virtual for transaction URL
transactionSchema.virtual('explorerUrl').get(function(this: ITransaction) {
  // This would be configured based on the network
  const network = process.env.NETWORK || 'sepolia';
  const baseUrl = network === 'sepolia' 
    ? 'https://sepolia.etherscan.io/tx/'
    : 'https://polygonscan.com/tx/';
  
  return baseUrl + this.txHash;
});

// Instance method to confirm transaction
transactionSchema.methods.confirm = function(blockNumber: number, gasUsed: number, gasPrice: string) {
  this.status = 'CONFIRMED';
  this.blockNumber = blockNumber;
  this.gasUsed = gasUsed;
  this.gasPrice = gasPrice;
  this.confirmedAt = new Date();
  return this.save();
};

// Instance method to mark transaction as failed
transactionSchema.methods.fail = function(errorMessage: string) {
  this.status = 'FAILED';
  this.errorMessage = errorMessage;
  this.failedAt = new Date();
  return this.save();
};

// Static method to get pending transactions
transactionSchema.statics.getPending = function() {
  return this.find({ status: 'PENDING' }).sort({ createdAt: 1 });
};

// Static method to get transactions by address
transactionSchema.statics.getByAddress = function(address: string) {
  return this.find({
    $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }]
  }).sort({ createdAt: -1 });
};

export default mongoose.model<ITransaction>('Transaction', transactionSchema);