import AuditLog from '../models/AuditLog.js';

export const logAudit = async (options) => {
  try {
    const {
      action,
      userId,
      userName,
      userRole,
      entity,
      entityId,
      description,
      before = null,
      after = null,
      ipAddress = null,
      status = 'success',
      errorMessage = null,
    } = options;

    const auditEntry = new AuditLog({
      action,
      user: {
        userId,
        userName,
        role: userRole,
      },
      entity,
      entityId,
      changes: {
        before,
        after,
      },
      description,
      timestamp: new Date(),
      ipAddress,
      status,
      errorMessage,
    });

    await auditEntry.save();
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit entry:', error);
    // Don't throw - audit logging failure shouldn't block main operations
    return null;
  }
};

export const getAuditTrail = async (filters = {}) => {
  try {
    const {
      entity,
      entityId,
      userId,
      action,
      limit = 50,
      skip = 0,
      requesterRole,
    } = filters;

    const query = {};
    if (entity) query.entity = entity;
    if (entityId) query.entityId = entityId;
    if (userId) query['user.userId'] = userId;
    if (action) query.action = action;

    // Quality users can only view operator and quality audit entries.
    if (requesterRole === 'quality') {
      query['user.role'] = { $in: ['operator', 'quality'] };
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      total,
      limit,
      skip,
    };
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    throw error;
  }
};

export const auditMiddleware = (req, res, next) => {
  // Attach audit info to request for use in controllers
  req.auditInfo = {
    userId: req.user?._id,
    userName: req.user?.fullName,
    userRole: req.user?.role,
    ipAddress: req.ip || req.connection.remoteAddress,
  };

  next();
};
