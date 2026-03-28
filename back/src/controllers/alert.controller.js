import Alert from '../models/Alert.js';
import CorrectiveAction from '../models/CorrectiveAction.js';
import { logAudit } from '../services/audit.service.js';
import { emitRealtimeEvent } from '../services/realtime.service.js';

export const getAlerts = async (req, res, next) => {
  try {
    const {
      process,
      type,
      status,
      limit = 50,
      skip = 0,
      sort = '-date',
    } = req.query;

    const filter = {};
    if (process) filter.process = process;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const alerts = await Alert.find(filter)
      .populate('process', 'name productionLine')
      .sort(sort)
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .lean();

    const total = await Alert.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      alerts,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['treated', 'not_treated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status doit etre treated ou not_treated.',
      });
    }

    const beforeAlert = await Alert.findById(req.params.id);
    if (!beforeAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte introuvable.',
      });
    }

    const previousStatus = beforeAlert.status;
    beforeAlert.status = status;
    await beforeAlert.save();

    await logAudit({
      action: 'UPDATE_ALERT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Alert',
      entityId: beforeAlert._id,
      description: `Statut alerte mis a jour: ${status}`,
      before: { status: previousStatus },
      after: { status: beforeAlert.status },
      ipAddress: req.ip,
    });

    emitRealtimeEvent('alert:updated', {
      _id: String(beforeAlert._id),
      status: beforeAlert.status,
      previousStatus,
      updatedBy: req.user?.fullName || 'unknown',
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Statut alerte mis a jour.',
      alert: beforeAlert,
    });
  } catch (error) {
    return next(error);
  }
};

export const addCorrectiveAction = async (req, res, next) => {
  try {
    const { description, result } = req.body;

    if (!description || !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: 'description est requise.',
      });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte introuvable.',
      });
    }

    const action = await CorrectiveAction.create({
      alert: alert._id,
      description: String(description).trim(),
      responsible: req.user?._id,
      result: result ? String(result).trim() : '',
    });

    await logAudit({
      action: 'CREATE_ALERT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'CorrectiveAction',
      entityId: action._id,
      description: `Action corrective ajoutee sur alerte ${alert._id}`,
      after: action.toObject(),
      ipAddress: req.ip,
    });

    emitRealtimeEvent('corrective-action:created', {
      alertId: String(alert._id),
      actionId: String(action._id),
      description: action.description,
      createdBy: req.user?.fullName || 'unknown',
      createdAt: action.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Action corrective ajoutee.',
      action,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCorrectiveActionsByAlert = async (req, res, next) => {
  try {
    const actions = await CorrectiveAction.find({ alert: req.params.id })
      .populate('responsible', 'fullName role')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: actions.length,
      actions,
    });
  } catch (error) {
    return next(error);
  }
};
