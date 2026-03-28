import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'CREATE_PROCESS',
      'UPDATE_PROCESS',
      'DELETE_PROCESS',
      'ACTIVATE_PROCESS',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'CREATE_MEASUREMENT',
      'CREATE_ALERT',
      'UPDATE_ALERT',
      'DELETE_ALERT',
      'EXPORT_REPORT',
      'VIEW_REPORT',
    ],
    required: true,
  },
  user: {
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    role: String,
  },
  entity: {
    type: String, // e.g., 'Process', 'User', 'Measurement', 'Alert'
    required: true,
  },
  entityId: mongoose.Schema.Types.ObjectId,
  changes: {
    before: mongoose.Schema.Types.Mixed, // Previous values
    after: mongoose.Schema.Types.Mixed, // New values
  },
  description: String, // Human-readable description
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ipAddress: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
  },
  errorMessage: String,
});

// Compound index for efficient queries
AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ 'user.userId': 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('AuditLog', AuditLogSchema);
