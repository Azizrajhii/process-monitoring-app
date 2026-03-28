import Process from '../models/Process.js';
import ProcessVersion from '../models/ProcessVersion.js';
import { logAudit } from '../services/audit.service.js';

const validateTargets = (cpTarget, cpkTarget, lsl, usl) => {
  if (cpTarget !== undefined && Number(cpTarget) <= 0) {
    return 'cpTarget doit être un nombre positif.';
  }
  if (cpkTarget !== undefined && Number(cpkTarget) <= 0) {
    return 'cpkTarget doit être un nombre positif.';
  }
  if (lsl !== undefined && !Number.isFinite(Number(lsl))) {
    return 'lsl doit être un nombre valide.';
  }
  if (usl !== undefined && !Number.isFinite(Number(usl))) {
    return 'usl doit être un nombre valide.';
  }

  const hasBothLimits = lsl !== undefined && usl !== undefined;
  if (hasBothLimits && Number(usl) <= Number(lsl)) {
    return 'usl doit être strictement supérieur à lsl.';
  }

  return null;
};

export const getProcesses = async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const filter = {};

    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: String(q), $options: 'i' } },
        { productionLine: { $regex: String(q), $options: 'i' } },
      ];
    }

    const processes = await Process.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: processes.length,
      processes,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProcessById = async (req, res, next) => {
  try {
    const process = await Process.findById(req.params.id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Processus introuvable.',
      });
    }

    return res.status(200).json({ success: true, process });
  } catch (error) {
    return next(error);
  }
};

export const createProcess = async (req, res, next) => {
  try {
    const { name, productionLine, cpTarget, cpkTarget, lsl, usl, status } = req.body;

    if (!name || !productionLine) {
      return res.status(400).json({
        success: false,
        message: 'name et productionLine sont requis.',
      });
    }

    const targetsError = validateTargets(cpTarget, cpkTarget, lsl, usl);
    if (targetsError) {
      return res.status(400).json({ success: false, message: targetsError });
    }

    const process = await Process.create({
      name,
      productionLine,
      cpTarget,
      cpkTarget,
      lsl,
      usl,
      status,
    });

    // Versioning: Save initial version
    await ProcessVersion.create({
      processId: process._id,
      version: 1,
      data: process.toObject(),
      modifiedBy: req.user?._id,
      modifiedAt: new Date(),
    });

    // Log to audit trail
    await logAudit({
      action: 'CREATE_PROCESS',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Process créé: ${name}`,
      after: process.toObject(),
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Processus créé avec succès.',
      process,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProcess = async (req, res, next) => {
  try {
    const { name, productionLine, cpTarget, cpkTarget, lsl, usl, status } = req.body;

    const targetsError = validateTargets(cpTarget, cpkTarget, lsl, usl);
    if (targetsError) {
      return res.status(400).json({ success: false, message: targetsError });
    }

    // Get before state for audit
    const beforeProcess = await Process.findById(req.params.id);
    const beforeState = beforeProcess ? beforeProcess.toObject() : null;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (productionLine !== undefined) updates.productionLine = productionLine;
    if (cpTarget !== undefined) updates.cpTarget = cpTarget;
    if (cpkTarget !== undefined) updates.cpkTarget = cpkTarget;
    if (lsl !== undefined) updates.lsl = lsl;
    if (usl !== undefined) updates.usl = usl;
    if (status !== undefined) updates.status = status;

    const process = await Process.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Processus introuvable.',
      });
    }

    // Versioning: Save previous version
    if (beforeProcess) {
      // Get latest version number
      const lastVersion = await ProcessVersion.find({ processId: process._id })
        .sort({ version: -1 })
        .limit(1);
      const nextVersion = lastVersion.length > 0 ? lastVersion[0].version + 1 : 1;
      await ProcessVersion.create({
        processId: process._id,
        version: nextVersion,
        data: beforeProcess.toObject(),
        modifiedBy: req.user?._id,
        modifiedAt: new Date(),
      });
    }

    // Log to audit trail
    await logAudit({
      action: 'UPDATE_PROCESS',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Process modifié: ${process.name}`,
      before: beforeState,
      after: process.toObject(),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Processus mis à jour.',
      process,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProcessStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status doit être active ou inactive.',
      });
    }

    const beforeProcess = await Process.findById(req.params.id);

    const process = await Process.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Processus introuvable.',
      });
    }

    await logAudit({
      action: status === 'active' ? 'ACTIVATE_PROCESS' : 'UPDATE_PROCESS',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Statut process change: ${status}`,
      before: beforeProcess ? { status: beforeProcess.status } : null,
      after: { status: process.status },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Processus ${status === 'active' ? 'activé' : 'désactivé'}.`,
      process,
    });
  } catch (error) {
    return next(error);
  }
};

// Récupérer l'historique des versions d'un process
export const getProcessHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await ProcessVersion.find({ processId: id })
      .sort({ version: -1 })
      .populate('modifiedBy', 'fullName role');
    return res.status(200).json({ success: true, history });
  } catch (error) {
    return next(error);
  }
};

// Comparer deux versions d'un process
export const compareProcessVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { v1, v2 } = req.query;
    if (!v1 || !v2) {
      return res.status(400).json({ success: false, message: 'Deux versions sont requises.' });
    }
    const version1 = await ProcessVersion.findOne({ processId: id, version: Number(v1) });
    const version2 = await ProcessVersion.findOne({ processId: id, version: Number(v2) });
    if (!version1 || !version2) {
      return res.status(404).json({ success: false, message: 'Version(s) introuvable(s).' });
    }
    return res.status(200).json({
      success: true,
      v1: version1.data,
      v2: version2.data,
      diff: getObjectDiff(version1.data, version2.data),
    });
  } catch (error) {
    return next(error);
  }
};

// Helper pour comparer deux objets (ignore les champs techniques, compare en string, deep pour objets/arrays)
function getObjectDiff(obj1, obj2) {
  const ignored = ['_id', '__v', 'createdAt', 'updatedAt', 'modifiedAt'];
  const diff = {};
  const keys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {})
  ]);
  for (const key of keys) {
    if (ignored.includes(key)) continue;
    const v1 = obj1 ? obj1[key] : undefined;
    const v2 = obj2 ? obj2[key] : undefined;
    // Deep compare for objects/arrays, else string compare
    if (typeof v1 === 'object' && typeof v2 === 'object') {
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        diff[key] = { before: v1, after: v2 };
      }
    } else if (String(v1) !== String(v2)) {
      diff[key] = { before: v1, after: v2 };
    }
  }
  return diff;
}
