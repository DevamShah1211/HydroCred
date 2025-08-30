import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: 'USER' | 'PRODUCTION_REQUEST' | 'TRANSACTION' | 'SYSTEM';
  entityId?: string;
  userId?: string;
  userWallet?: string;
  userRole?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['USER', 'PRODUCTION_REQUEST', 'TRANSACTION', 'SYSTEM']
  },
  entityId: {
    type: String,
    required: false,
    trim: true
  },
  userId: {
    type: String,
    required: false,
    trim: true
  },
  userWallet: {
    type: String,
    required: false,
    lowercase: true
  },
  userRole: {
    type: String,
    required: false,
    trim: true
  },
  oldValues: {
    type: Schema.Types.Mixed,
    required: false
  },
  newValues: {
    type: Schema.Types.Mixed,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: false,
    trim: true
  },
  userAgent: {
    type: String,
    required: false,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: false, // We use our own timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ userWallet: 1 });
auditLogSchema.index({ timestamp: -1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function(this: IAuditLog) {
  return this.timestamp.toLocaleString();
});

// Static method to log user action
auditLogSchema.statics.logUserAction = function(
  action: string,
  userId: string,
  userWallet: string,
  userRole: string,
  entityType: 'USER' | 'PRODUCTION_REQUEST' | 'TRANSACTION' | 'SYSTEM',
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  metadata?: any
) {
  return this.create({
    action,
    entityType,
    entityId,
    userId,
    userWallet,
    userRole,
    oldValues,
    newValues,
    metadata,
    timestamp: new Date()
  });
};

// Static method to log system action
auditLogSchema.statics.logSystemAction = function(
  action: string,
  entityType: 'USER' | 'PRODUCTION_REQUEST' | 'TRANSACTION' | 'SYSTEM',
  entityId?: string,
  metadata?: any
) {
  return this.create({
    action,
    entityType,
    entityId,
    metadata,
    timestamp: new Date()
  });
};

// Static method to get audit trail for an entity
auditLogSchema.statics.getAuditTrail = function(
  entityType: string,
  entityId: string,
  limit: number = 100
) {
  return this.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function(
  userId: string,
  limit: number = 100
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);