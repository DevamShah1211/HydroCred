const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Wallet information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid wallet address format'
    }
  },

  // User profile
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },

  // Role and hierarchy
  role: {
    type: String,
    required: true,
    enum: ['country_admin', 'state_admin', 'city_admin', 'producer', 'buyer', 'auditor'],
    default: 'producer'
  },

  // Geographic information
  country: {
    type: String,
    required: true,
    trim: true
  },
  
  state: {
    type: String,
    required: function() {
      return this.role !== 'country_admin';
    },
    trim: true
  },
  
  city: {
    type: String,
    required: function() {
      return ['city_admin', 'producer', 'buyer'].includes(this.role);
    },
    trim: true
  },

  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verificationDate: {
    type: Date
  },

  // Organization details (for producers and buyers)
  organizationName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  organizationType: {
    type: String,
    enum: ['government', 'private', 'ngo', 'research', 'other'],
    required: function() {
      return ['producer', 'buyer'].includes(this.role);
    }
  },

  // Producer-specific fields
  productionCapacity: {
    type: Number, // in kg/day
    required: function() {
      return this.role === 'producer';
    }
  },
  
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    documentHash: String
  }],

  // Buyer-specific fields
  industryType: {
    type: String,
    required: function() {
      return this.role === 'buyer';
    }
  },
  
  annualHydrogenNeed: {
    type: Number, // in kg/year
    required: function() {
      return this.role === 'buyer';
    }
  },

  // Contact information
  phoneNumber: {
    type: String,
    trim: true
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Profile settings
  profilePicture: {
    type: String // IPFS hash or file path
  },
  
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showTransactions: { type: Boolean, default: false }
    }
  },

  // Activity tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  loginCount: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  suspendedUntil: {
    type: Date
  },
  
  suspensionReason: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ country: 1, state: 1, city: 1 });
userSchema.index({ isVerified: 1 });

// Virtual for full name
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const addr = this.address;
  return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}, ${addr.country || ''} ${addr.zipCode || ''}`.trim();
});

// Methods
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.__v;
  
  // Remove sensitive information for public view
  if (!user.preferences?.privacy?.showProfile) {
    delete user.email;
    delete user.phoneNumber;
    delete user.address;
  }
  
  return user;
};

userSchema.methods.canVerify = function(targetUser) {
  // Country admin can verify state admins
  if (this.role === 'country_admin' && targetUser.role === 'state_admin') {
    return this.country === targetUser.country;
  }
  
  // State admin can verify city admins
  if (this.role === 'state_admin' && targetUser.role === 'city_admin') {
    return this.country === targetUser.country && this.state === targetUser.state;
  }
  
  // City admin can verify producers and buyers
  if (this.role === 'city_admin' && ['producer', 'buyer'].includes(targetUser.role)) {
    return this.country === targetUser.country && 
           this.state === targetUser.state && 
           this.city === targetUser.city;
  }
  
  return false;
};

userSchema.methods.getHierarchyLevel = function() {
  const levels = {
    'country_admin': 1,
    'state_admin': 2,
    'city_admin': 3,
    'producer': 4,
    'buyer': 4,
    'auditor': 5
  };
  return levels[this.role] || 6;
};

// Static methods
userSchema.statics.findByWallet = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.findVerifiedUsers = function(role, location = {}) {
  const query = { role, isVerified: true };
  if (location.country) query.country = location.country;
  if (location.state) query.state = location.state;
  if (location.city) query.city = location.city;
  return this.find(query);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Normalize wallet address
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase();
  }
  
  // Auto-verify country admin (first user)
  if (this.role === 'country_admin' && this.isNew) {
    this.isVerified = true;
    this.verificationDate = new Date();
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);