import mongoose, { Document, Schema } from 'mongoose';
import { ethers } from 'ethers';

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  email?: string;
  role: 'COUNTRY_ADMIN' | 'STATE_ADMIN' | 'CITY_ADMIN' | 'PRODUCER' | 'BUYER' | 'AUDITOR';
  country?: string;
  state?: string;
  city?: string;
  organization?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  nonce: string;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: (address: string) => ethers.isAddress(address),
      message: 'Invalid wallet address'
    }
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: (email: string) => {
        if (!email) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Invalid email format'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN', 'PRODUCER', 'BUYER', 'AUDITOR'],
    default: 'PRODUCER'
  },
  country: {
    type: String,
    required: function(this: IUser) {
      return ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(this.role);
    },
    trim: true
  },
  state: {
    type: String,
    required: function(this: IUser) {
      return ['STATE_ADMIN', 'CITY_ADMIN'].includes(this.role);
    },
    trim: true
  },
  city: {
    type: String,
    required: function(this: IUser) {
      return this.role === 'CITY_ADMIN';
    },
    trim: true
  },
  organization: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String,
    required: false,
    validate: {
      validator: (address: string) => !address || ethers.isAddress(address),
      message: 'Invalid verifier wallet address'
    }
  },
  verifiedAt: {
    type: Date,
    required: false
  },
  nonce: {
    type: String,
    required: true,
    unique: true
  },
  lastLogin: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ role: 1 });
userSchema.index({ country: 1, state: 1, city: 1 });
userSchema.index({ isVerified: 1 });

// Virtual for role hierarchy
userSchema.virtual('canVerify').get(function(this: IUser) {
  return ['COUNTRY_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN'].includes(this.role);
});

userSchema.virtual('canAppoint').get(function(this: IUser) {
  switch (this.role) {
    case 'COUNTRY_ADMIN':
      return ['STATE_ADMIN', 'CITY_ADMIN', 'PRODUCER', 'BUYER', 'AUDITOR'];
    case 'STATE_ADMIN':
      return ['CITY_ADMIN', 'PRODUCER', 'BUYER', 'AUDITOR'];
    case 'CITY_ADMIN':
      return ['PRODUCER', 'BUYER', 'AUDITOR'];
    default:
      return [];
  }
});

// Pre-save middleware to generate nonce
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('nonce')) {
    this.nonce = ethers.randomBytes(32).toString('hex');
  }
  next();
});

// Static method to find users by role hierarchy
userSchema.statics.findByRoleHierarchy = function(role: string, location: { country?: string, state?: string, city?: string }) {
  const query: any = { role };
  
  if (location.country) query.country = location.country;
  if (location.state) query.state = location.state;
  if (location.city) query.city = location.city;
  
  return this.find(query);
};

// Instance method to check if user can verify another user
userSchema.methods.canVerifyUser = function(targetUser: IUser): boolean {
  if (!this.isVerified) return false;
  
  switch (this.role) {
    case 'COUNTRY_ADMIN':
      return true; // Can verify anyone
    case 'STATE_ADMIN':
      return targetUser.country === this.country && 
             (targetUser.role === 'CITY_ADMIN' || targetUser.role === 'PRODUCER' || targetUser.role === 'BUYER' || targetUser.role === 'AUDITOR');
    case 'CITY_ADMIN':
      return targetUser.country === this.country && 
             targetUser.state === this.state && 
             (targetUser.role === 'PRODUCER' || targetUser.role === 'BUYER' || targetUser.role === 'AUDITOR');
    default:
      return false;
  }
};

export default mongoose.model<IUser>('User', userSchema);