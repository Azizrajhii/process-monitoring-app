import Measurement from '../models/Measurement.js';
import Process from '../models/Process.js';
import Alert from '../models/Alert.js';
import { logAudit } from '../services/audit.service.js';
import { emitRealtimeEvent } from '../services/realtime.service.js';

const parseCsvRows = (csvText) => {
  const lines = String(csvText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const splitLine = (line) => line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
};

const findHeaderIndex = (headers, candidates) => {
  for (const key of candidates) {
    const idx = headers.indexOf(key);
    if (idx !== -1) return idx;
  }
  return -1;
};

const maybeCreateLimitAlert = async ({ processDoc, value, ipAddress }) => {
  if (!processDoc) return null;

  const hasLimits = Number.isFinite(Number(processDoc.lsl)) && Number.isFinite(Number(processDoc.usl));
  if (!hasLimits) return null;

  const isOutOfSpec = Number(value) < Number(processDoc.lsl) || Number(value) > Number(processDoc.usl);
  if (!isOutOfSpec) return null;

  const message = `Mesure hors limites (${value}) pour ${processDoc.name} [LSL=${processDoc.lsl}, USL=${processDoc.usl}]`;

  const alert = await Alert.create({
    process: processDoc._id,
    type: 'limit_exceeded',
    message,
    status: 'not_treated',
  });

  await logAudit({
    action: 'CREATE_ALERT',
    userId: null,
    userName: 'system',
    userRole: 'system',
    entity: 'Alert',
    entityId: alert._id,
    description: `Alerte automatique creee pour ${processDoc.name}`,
    after: alert.toObject(),
    ipAddress,
  });

  emitRealtimeEvent('alert:created', {
    _id: String(alert._id),
    processId: String(processDoc._id),
    processName: processDoc.name,
    type: alert.type,
    message: alert.message,
    status: alert.status,
    date: alert.date,
  });

  return alert;
};

export const getMeasurements = async (req, res, next) => {
  try {
    const { process, limit = 50, skip = 0, sort = '-date' } = req.query;
    const filter = {};

    if (process) {
      filter.process = process;
    }
    if (req.user?.role === 'operator') {
      filter.createdBy = req.user._id;
    }
    
    const measurements = await Measurement.find(filter)
      .populate('process', 'name')
      .populate('createdBy', 'fullName role')
      .sort(sort)
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .lean();

    const total = await Measurement.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: measurements.length,
      total,
      measurements,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMeasurementById = async (req, res, next) => {
  try {
    const measurement = await Measurement.findById(req.params.id)
      .populate('process', 'name lsl usl')
      .populate('createdBy', 'fullName role')
      .lean();

    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Mesure introuvable.',
      });
    }

    const ownerId = String(measurement.createdBy?._id || measurement.createdBy || '');
    if (req.user?.role === 'operator' && ownerId !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez consulter que vos propres mesures.',
      });
    }

    return res.status(200).json({
      success: true,
      measurement,
    });
  } catch (error) {
    return next(error);
  }
};

export const createMeasurement = async (req, res, next) => {
  try {
    const { process, value, date, comment } = req.body;

    if (!process || value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'process et value sont requis.',
      });
    }

    if (!Number.isFinite(Number(value))) {
      return res.status(400).json({
        success: false,
        message: 'value doit être un nombre valide.',
      });
    }

    // Verify process exists
    const processDoc = await Process.findById(process);
    if (!processDoc) {
      return res.status(404).json({
        success: false,
        message: 'Processus non trouvé.',
      });
    }

    const measurement = await Measurement.create({
      process,
      value: Number(value),
      date: date ? new Date(date) : new Date(),
      comment: comment || '',
      createdBy: req.user?._id,
    });

    // Log to audit trail
    await logAudit({
      action: 'CREATE_MEASUREMENT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Measurement',
      entityId: measurement._id,
      description: `Mesure créée pour ${processDoc.name}: ${value}`,
      after: measurement.toObject(),
      ipAddress: req.ip,
    });

    await maybeCreateLimitAlert({
      processDoc,
      value: Number(value),
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Mesure enregistrée avec succès.',
      measurement,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMeasurement = async (req, res, next) => {
  try {
    const { value, comment, date } = req.body;

    const beforeMeasurement = await Measurement.findById(req.params.id);
    if (!beforeMeasurement) {
      return res.status(404).json({
        success: false,
        message: 'Mesure introuvable.',
      });
    }

    if (req.user?.role === 'operator' && String(beforeMeasurement.createdBy || '') !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez modifier que vos propres mesures.',
      });
    }

    if (value !== undefined && !Number.isFinite(Number(value))) {
      return res.status(400).json({
        success: false,
        message: 'value doit être un nombre valide.',
      });
    }

    const updates = {};
    if (value !== undefined) updates.value = Number(value);
    if (comment !== undefined) updates.comment = comment;
    if (date !== undefined) updates.date = new Date(date);

    const measurement = await Measurement.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    // Log to audit trail
    const process = await Process.findById(beforeMeasurement.process);
    await logAudit({
      action: 'UPDATE_MEASUREMENT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Measurement',
      entityId: measurement._id,
      description: `Mesure modifiée pour ${process?.name || 'process inconnu'}`,
      before: beforeMeasurement.toObject(),
      after: measurement.toObject(),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Mesure mise à jour.',
      measurement,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMeasurement = async (req, res, next) => {
  try {
    const measurement = await Measurement.findById(req.params.id);

    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Mesure introuvable.',
      });
    }

    if (req.user?.role === 'operator' && String(measurement.createdBy || '') !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez supprimer que vos propres mesures.',
      });
    }

    await measurement.deleteOne();

    // Log to audit trail
    const process = await Process.findById(measurement.process);
    await logAudit({
      action: 'DELETE_MEASUREMENT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Measurement',
      entityId: req.params.id,
      description: `Mesure supprimée pour ${process?.name || 'process inconnu'}`,
      before: measurement.toObject(),
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Mesure supprimée avec succès.',
    });
  } catch (error) {
    return next(error);
  }
};

export const importMeasurementsCsv = async (req, res, next) => {
  try {
    const { csv } = req.body;

    if (!csv || !String(csv).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu CSV est requis.',
      });
    }

    const { headers, rows } = parseCsvRows(csv);
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le CSV ne contient aucune ligne de donnees.',
      });
    }

    const processIndex = findHeaderIndex(headers, ['process', 'process_name', 'processid', 'process_id']);
    const valueIndex = findHeaderIndex(headers, ['value', 'measurement', 'mesure']);
    const dateIndex = findHeaderIndex(headers, ['date', 'measurement_date']);
    const commentIndex = findHeaderIndex(headers, ['comment', 'note', 'description']);

    if (processIndex === -1 || valueIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Le CSV doit contenir au minimum les colonnes process et value.',
      });
    }

    const processDocs = await Process.find({}).select('_id name lsl usl').lean();
    const processById = new Map(processDocs.map((p) => [String(p._id), p]));
    const processByName = new Map(processDocs.map((p) => [String(p.name).toLowerCase(), p]));

    const imported = [];
    const errors = [];
    let alertsCreated = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNumber = i + 2;

      const processRaw = row[processIndex];
      const valueRaw = row[valueIndex];
      const dateRaw = dateIndex === -1 ? null : row[dateIndex];
      const commentRaw = commentIndex === -1 ? '' : row[commentIndex];

      const numericValue = Number(valueRaw);
      if (!processRaw || !Number.isFinite(numericValue)) {
        errors.push({ row: rowNumber, message: 'process ou value invalide.' });
        continue;
      }

      const processDoc = processById.get(processRaw) || processByName.get(String(processRaw).toLowerCase());
      if (!processDoc) {
        errors.push({ row: rowNumber, message: `Process introuvable: ${processRaw}` });
        continue;
      }

      const parsedDate = dateRaw ? new Date(dateRaw) : new Date();
      if (Number.isNaN(parsedDate.getTime())) {
        errors.push({ row: rowNumber, message: `Date invalide: ${dateRaw}` });
        continue;
      }

      const measurement = await Measurement.create({
        process: processDoc._id,
        value: numericValue,
        date: parsedDate,
        comment: commentRaw || '',
        createdBy: req.user?._id,
      });

      imported.push(measurement);

      const alert = await maybeCreateLimitAlert({
        processDoc,
        value: numericValue,
        ipAddress: req.ip,
      });
      if (alert) alertsCreated += 1;
    }

    await logAudit({
      action: 'CREATE_MEASUREMENT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Measurement',
      description: `Import CSV mesures: ${imported.length} ligne(s) importee(s)` ,
      after: {
        importedCount: imported.length,
        errorCount: errors.length,
        alertsCreated,
      },
      ipAddress: req.ip,
    });

    emitRealtimeEvent('measurements:imported', {
      importedCount: imported.length,
      alertsCreated,
      userName: req.user?.fullName || 'unknown',
      at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Import CSV termine.',
      importedCount: imported.length,
      alertsCreated,
      errors,
    });
  } catch (error) {
    return next(error);
  }
};
