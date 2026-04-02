import express from 'express';
import { getAuditTrail } from '../services/audit.service.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Manager and Manager Qualite can view audit trail
router.get('/audit-trail', protect, restrictTo('manager', 'quality'), async (req, res, next) => {
  try {
    const { entity, entityId, action, limit = 50, skip = 0 } = req.query;

    const filters = {
      entity: entity || null,
      entityId: entityId || null,
      action: action || null,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      requesterRole: req.user?.role,
    };

    // Remove null filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] === null || filters[key] === 'null') {
        delete filters[key];
      }
    });

    const result = await getAuditTrail(filters);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
});

// Get audit trail for specific entity
router.get('/audit-trail/:entity/:entityId', protect, restrictTo('manager', 'quality'), async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;

    const result = await getAuditTrail({
      entity,
      entityId,
      limit: 100,
      requesterRole: req.user?.role,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
