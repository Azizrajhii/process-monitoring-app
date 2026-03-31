// GET /api/reports/incapable-rate-7days
// Retourne le taux de process non capable (Cpk < 1.33) sur les 7 derniers jours
export const getIncapableRate7Days = async (req, res, next) => {
  try {
    const CPK_THRESHOLD = 1.33;
    const processes = await Process.find({ status: 'active' });
    const today = dayjs().startOf('day');
    const days = Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, 'day'));

    // Helper: calcul Cpk
    function calculateCpk(values, lsl, usl) {
      if (!values.length || lsl == null || usl == null) return null;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      if (std === 0) return null;
      const cpu = (usl - mean) / (3 * std);
      const cpl = (mean - lsl) / (3 * std);
      return Math.min(cpu, cpl);
    }

    let incapableCount = 0;
    let totalCount = 0;
    const details = [];

    for (const proc of processes) {
      // Pour chaque process, calculer le Cpk moyen sur 7 jours
      let cpkSum = 0;
      let cpkDays = 0;
      for (const day of days) {
        const nextDay = day.add(1, 'day');
        const windowStart = day.subtract(6, 'day');
        const measurements = await Measurement.find({
          process: proc._id,
          date: { $gte: windowStart.toDate(), $lt: nextDay.toDate() },
        });
        const values = measurements.map(m => m.value);
        const cpk = calculateCpk(values, proc.lsl, proc.usl);
        if (cpk !== null) {
          cpkSum += cpk;
          cpkDays++;
        }
      }
      if (cpkDays > 0) {
        const avgCpk = cpkSum / cpkDays;
        totalCount++;
        if (avgCpk < CPK_THRESHOLD) {
          incapableCount++;
        }
        details.push({
          processId: proc._id,
          processName: proc.name,
          avgCpk,
          incapable: avgCpk < CPK_THRESHOLD,
        });
      }
    }

    const rate = totalCount === 0 ? 0 : incapableCount / totalCount;
    res.json({
      incapableRate: rate,
      incapableCount,
      totalCount,
      details,
      threshold: CPK_THRESHOLD,
    });
  } catch (err) {
    console.error('Erreur getIncapableRate7Days:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
import Alert from '../models/Alert.js';
import PDFDocument from 'pdfkit';
import Measurement from '../models/Measurement.js';
import Process from '../models/Process.js';
import { logAudit } from '../services/audit.service.js';
import dayjs from 'dayjs';
// GET /api/reports/cpk-evolution-7days
// Retourne l'évolution du Cpk pour chaque process sur les 7 derniers jours
export const getCpkEvolution7Days = async (req, res, next) => {
  try {
    const processes = await Process.find({ status: 'active' });
    const today = dayjs().startOf('day');
    const days = Array.from({ length: 7 }, (_, i) => today.subtract(6 - i, 'day'));

    // Helper: calcul Cpk
    function calculateCpk(values, lsl, usl) {
      if (!values.length || lsl == null || usl == null) return null;
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      if (std === 0) return null;
      const cpu = (usl - mean) / (3 * std);
      const cpl = (mean - lsl) / (3 * std);
      return Math.min(cpu, cpl);
    }

    const result = await Promise.all(processes.map(async (proc) => {
      const dailyCpk = await Promise.all(days.map(async (day) => {
        const nextDay = day.add(1, 'day');
        const windowStart = day.subtract(6, 'day');
        const measurements = await Measurement.find({
          process: proc._id,
          date: { $gte: windowStart.toDate(), $lt: nextDay.toDate() },
        });
        const values = measurements.map(m => m.value);
        const cpk = calculateCpk(values, proc.lsl, proc.usl);
        return {
          date: day.format('YYYY-MM-DD'),
          cpk,
        };
      }));
      return {
        processId: proc._id,
        processName: proc.name,
        dailyCpk,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur getCpkEvolution7Days:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

const meanOf = (values) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdDevOf = (values, mean) => {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const computeCapability = ({ lsl, usl, mean, stdDev }) => {
  if (!Number.isFinite(lsl) || !Number.isFinite(usl) || stdDev <= 0 || usl <= lsl) {
    return { cp: null, cpk: null };
  }

  const cp = (usl - lsl) / (6 * stdDev);
  const cpk = Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev));

  return {
    cp: safeNumber(cp),
    cpk: safeNumber(cpk),
  };
};

const buildHistogram = (values, bins = 6) => {
  if (values.length === 0) {
    return {
      labels: ['N/A'],
      counts: [0],
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      labels: [`${min.toFixed(2)} - ${max.toFixed(2)}`],
      counts: [values.length],
    };
  }

  const width = (max - min) / bins;
  const counts = Array.from({ length: bins }, () => 0);

  for (const value of values) {
    const rawIndex = Math.floor((value - min) / width);
    const index = Math.min(Math.max(rawIndex, 0), bins - 1);
    counts[index] += 1;
  }

  const labels = counts.map((_, index) => {
    const start = min + index * width;
    const end = index === bins - 1 ? max : min + (index + 1) * width;
    return `${start.toFixed(2)} - ${end.toFixed(2)}`;
  });

  return { labels, counts };
};

const buildConclusion = (cpk, sampleSize) => {
  if (sampleSize < 2 || cpk === null) {
    return {
      status: 'insufficient_data',
      message: 'Donnees insuffisantes pour conclure. Ajoutez plus de mesures.',
    };
  }

  if (cpk >= 1.33) {
    return {
      status: 'capable',
      message: 'Process capable (Cpk > 1.33)',
    };
  }

  return {
    status: 'non_capable',
    message: 'Process non capable - Action requise',
  };
};

const detectAutomaticAlerts = (values, mean, stdDev, lsl, usl, cpk, sampleSize, cpkThreshold = 1.33) => {
  const detectedAlerts = [];

  // 1. Check for insufficient data
  if (sampleSize < 30) {
    detectedAlerts.push({
      type: 'insufficient_data',
      message: `Echantillon insuffisant (${sampleSize} mesures). Cpk non fiable.`,
    });
  }

  // 2. Check for LSL/USL breaches
  const lslBreaches = values.filter((v) => v < lsl).length;
  const uslBreaches = values.filter((v) => v > usl).length;

  if (lslBreaches > 0) {
    detectedAlerts.push({
      type: 'lsl_breach',
      message: `${lslBreaches} mesure(s) sous LSL (${lsl})`,
    });
  }

  if (uslBreaches > 0) {
    detectedAlerts.push({
      type: 'usl_breach',
      message: `${uslBreaches} mesure(s) au-dessus USL (${usl})`,
    });
  }

  // 2b. Pré-alerte si proche de LSL/USL (10% marge)
  const margin = 0.1 * (usl - lsl);
  const nearLslCount = values.filter((v) => v >= lsl && v < lsl + margin).length;
  const nearUslCount = values.filter((v) => v <= usl && v > usl - margin).length;
  if (nearLslCount > 0) {
    detectedAlerts.push({
      type: 'near_lsl',
      message: `${nearLslCount} mesure(s) proche de LSL (${lsl}) ⚠️`,
    });
  }
  if (nearUslCount > 0) {
    detectedAlerts.push({
      type: 'near_usl',
      message: `${nearUslCount} mesure(s) proche de USL (${usl}) ⚠️`,
    });
  }

  // 3. Check for Cpk < threshold
  if (cpk !== null && cpk < cpkThreshold) {
    detectedAlerts.push({
      type: 'cpk_low',
      message: `Cpk insuffisant (${cpk.toFixed(2)} < ${cpkThreshold}). Process non capable.`,
    });
  }

  // 4. Check for SPC drift (trend detection, 6/8 rule)
  if (values.length >= 8) {
    const recentValues = values.slice(-8);
    let asc = 0, desc = 0;
    for (let i = 1; i < recentValues.length; i++) {
      if (recentValues[i] > recentValues[i - 1]) asc++;
      if (recentValues[i] < recentValues[i - 1]) desc++;
    }
    if (asc >= 6) {
      detectedAlerts.push({
        type: 'trend_up',
        message: `Tendance ascendante sur les 8 dernieres mesures (6/8 ou plus en hausse)`,
      });
    }
    if (desc >= 6) {
      detectedAlerts.push({
        type: 'trend_down',
        message: `Tendance descendante sur les 8 dernieres mesures (6/8 ou plus en baisse)`,
      });
    }
  }

  // 5. Statistical anomaly detection (z-score > 3)
  if (stdDev > 0 && values.length > 0) {
    const anomalies = values
      .map((v, i) => ({ v, i, z: Math.abs((v - mean) / stdDev) }))
      .filter((item) => item.z > 3);
    if (anomalies.length > 0) {
      detectedAlerts.push({
        type: 'stat_anomaly',
        message: `${anomalies.length} mesure(s) anormale(s) détectée(s) (z-score > 3)`,
        details: anomalies.map(a => ({ index: a.i, value: a.v, z: a.z.toFixed(2) })),
      });
    }
  }

  return detectedAlerts;
};

const PERIOD_TO_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
};

const getRangeWindows = (period = 'week', points = 8) => {
  const windowDays = PERIOD_TO_DAYS[period] || PERIOD_TO_DAYS.week;
  const now = new Date();
  const ranges = [];

  for (let i = points - 1; i >= 0; i -= 1) {
    const end = new Date(now.getTime() - i * windowDays * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);
    ranges.push({ start, end });
  }

  return ranges;
};

const computePointStats = (values, lsl, usl) => {
  const mean = meanOf(values);
  const stdDev = stdDevOf(values, mean);
  const capability = computeCapability({ lsl, usl, mean, stdDev });

  return {
    sampleSize: values.length,
    mean,
    stdDev,
    cp: capability.cp,
    cpk: capability.cpk,
  };
};

const loadProcessReportData = async (processId) => {
  const processDoc = await Process.findById(processId);
  const process = processDoc ? processDoc.toObject() : null;
  if (!process) return null;

  let shouldPatchLimits = false;
  if (!Number.isFinite(Number(process.lsl))) {
    process.lsl = 85;
    shouldPatchLimits = true;
  }
  if (!Number.isFinite(Number(process.usl))) {
    process.usl = 95;
    shouldPatchLimits = true;
  }
  if (Number(process.usl) <= Number(process.lsl)) {
    process.lsl = 85;
    process.usl = 95;
    shouldPatchLimits = true;
  }

  if (shouldPatchLimits) {
    processDoc.lsl = process.lsl;
    processDoc.usl = process.usl;
    await processDoc.save();
  }

  const measurements = await Measurement.find({ process: processId })
    .sort({ date: 1 })
    .select('value date')
    .lean();

  const values = measurements
    .map((item) => Number(item.value))
    .filter((value) => Number.isFinite(value));

  const mean = meanOf(values);
  const stdDev = stdDevOf(values, mean);
  const capability = computeCapability({
    lsl: Number(process.lsl),
    usl: Number(process.usl),
    mean,
    stdDev,
  });

  const histogram = buildHistogram(values, 6);

  return {
    process,
    measurements,
    values,
    mean,
    stdDev,
    cp: capability.cp,
    cpk: capability.cpk,
    histogram,
  };
};

export const getProcessReport = async (req, res, next) => {
  try {
    const reportData = await loadProcessReportData(req.params.id);

    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: 'Processus introuvable.',
      });
    }

    const { process, measurements, values, mean, stdDev, cp, cpk, histogram } = reportData;

    // Detect automatic system alerts
    const systemAlerts = detectAutomaticAlerts(
      values,
      mean,
      stdDev,
      Number(process.lsl),
      Number(process.usl),
      cpk,
      values.length,
      process.cpkTarget || 1.33 // seuil paramétrable
    );

    // Get stored user alerts
    const storedAlerts = await Alert.find({ process: process._id })
      .sort({ date: -1 })
      .limit(20)
      .select('type message status date')
      .lean();

    // Combine system alerts (marked as 'system') with stored alerts for display
    const combinedAlerts = [
      ...systemAlerts.map((a) => ({
        ...a,
        status: 'system',
        date: new Date(),
      })),
      ...storedAlerts,
    ];

    const spcLabels = measurements.map((item) =>
      new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    );

    const conclusion = buildConclusion(cpk, values.length);

    await logAudit({
      action: 'VIEW_REPORT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Consultation du rapport process ${process.name}`,
      after: {
        processId: process._id,
        sampleSize: values.length,
        cp,
        cpk,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      report: {
        process: {
          _id: process._id,
          name: process.name,
          productionLine: process.productionLine,
          lsl: process.lsl,
          usl: process.usl,
          cpTarget: process.cpTarget,
          cpkTarget: process.cpkTarget,
        },
        analysisDate: new Date().toISOString(),
        statistics: {
          sampleSize: values.length,
          mean,
          stdDev,
          cp,
          cpk,
        },
        charts: {
          spc: {
            labels: spcLabels,
            values,
            lsl: process.lsl,
            usl: process.usl,
          },
          histogram,
        },
        alerts: combinedAlerts,
        conclusion,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getProcessReportHistory = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const points = Math.min(Number(req.query.points || 8), 24);
    const reportData = await loadProcessReportData(req.params.id);

    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Processus introuvable.' });
    }

    const { process, measurements } = reportData;
    const lsl = Number(process.lsl);
    const usl = Number(process.usl);
    const ranges = getRangeWindows(String(period), points);

    const history = ranges.map((range) => {
      const values = measurements
        .filter((m) => new Date(m.date) >= range.start && new Date(m.date) < range.end)
        .map((m) => Number(m.value))
        .filter((v) => Number.isFinite(v));

      const stats = computePointStats(values, lsl, usl);
      return {
        label: `${range.start.toLocaleDateString('fr-FR')} - ${range.end.toLocaleDateString('fr-FR')}`,
        ...stats,
      };
    });

    return res.status(200).json({
      success: true,
      process: {
        _id: process._id,
        name: process.name,
      },
      period,
      points,
      history,
    });
  } catch (error) {
    return next(error);
  }
};

export const compareProcessPeriods = async (req, res, next) => {
  try {
    const { currentDays = 30, previousDays = 30 } = req.query;
    const reportData = await loadProcessReportData(req.params.id);

    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Processus introuvable.' });
    }

    const { process, measurements } = reportData;
    const now = new Date();
    const currentStart = new Date(now.getTime() - Number(currentDays) * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - Number(previousDays) * 24 * 60 * 60 * 1000);

    const getValuesInRange = (from, to) =>
      measurements
        .filter((m) => new Date(m.date) >= from && new Date(m.date) < to)
        .map((m) => Number(m.value))
        .filter((v) => Number.isFinite(v));

    const currentValues = getValuesInRange(currentStart, now);
    const previousValues = getValuesInRange(previousStart, currentStart);

    const current = computePointStats(currentValues, Number(process.lsl), Number(process.usl));
    const previous = computePointStats(previousValues, Number(process.lsl), Number(process.usl));

    return res.status(200).json({
      success: true,
      process: {
        _id: process._id,
        name: process.name,
      },
      current,
      previous,
      delta: {
        cp: safeNumber((current.cp ?? 0) - (previous.cp ?? 0)),
        cpk: safeNumber((current.cpk ?? 0) - (previous.cpk ?? 0)),
        sampleSize: current.sampleSize - previous.sampleSize,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const exportProcessReportCsv = async (req, res, next) => {
  try {
    const reportData = await loadProcessReportData(req.params.id);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Processus introuvable.' });
    }

    const { process, measurements, mean, stdDev, cp, cpk } = reportData;
    const header = [
      'process_name',
      'production_line',
      'lsl',
      'usl',
      'sample_size',
      'mean',
      'std_dev',
      'cp',
      'cpk',
      'measurement_date',
      'measurement_value',
    ];

    const lines = [header.join(',')];

    for (const m of measurements) {
      lines.push([
        `"${String(process.name).replaceAll('"', '""')}"`,
        `"${String(process.productionLine).replaceAll('"', '""')}"`,
        Number(process.lsl),
        Number(process.usl),
        measurements.length,
        safeNumber(mean),
        safeNumber(stdDev),
        cp === null ? '' : safeNumber(cp),
        cpk === null ? '' : safeNumber(cpk),
        new Date(m.date).toISOString(),
        Number(m.value),
      ].join(','));
    }

    await logAudit({
      action: 'EXPORT_REPORT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Export CSV rapport process ${process.name}`,
      after: { format: 'csv', sampleSize: measurements.length },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report-${process._id}.csv"`);

    return res.status(200).send(lines.join('\n'));
  } catch (error) {
    return next(error);
  }
};

export const exportProcessReportPdf = async (req, res, next) => {
  try {
    const reportData = await loadProcessReportData(req.params.id);
    if (!reportData) {
      return res.status(404).json({ success: false, message: 'Processus introuvable.' });
    }

    const { process, measurements, mean, stdDev, cp, cpk } = reportData;

    await logAudit({
      action: 'EXPORT_REPORT',
      userId: req.user?._id,
      userName: req.user?.fullName,
      userRole: req.user?.role,
      entity: 'Process',
      entityId: process._id,
      description: `Export PDF rapport process ${process.name}`,
      after: { format: 'pdf', sampleSize: measurements.length },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${process._id}.pdf"`);

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text('Rapport Process', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Process: ${process.name}`);
    doc.text(`Ligne: ${process.productionLine}`);
    doc.text(`Date analyse: ${new Date().toLocaleString('fr-FR')}`);
    doc.moveDown();

    doc.fontSize(14).text('Spec et statistiques', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`LSL: ${Number(process.lsl)}`);
    doc.text(`USL: ${Number(process.usl)}`);
    doc.text(`Nombre mesures: ${measurements.length}`);
    doc.text(`Moyenne: ${safeNumber(mean).toFixed(4)}`);
    doc.text(`Ecart type: ${safeNumber(stdDev).toFixed(4)}`);
    doc.text(`Cp: ${cp === null ? 'N/A' : safeNumber(cp).toFixed(4)}`);
    doc.text(`Cpk: ${cpk === null ? 'N/A' : safeNumber(cpk).toFixed(4)}`);
    doc.moveDown();

    const conclusion = buildConclusion(cpk, measurements.length);
    doc.fontSize(14).text('Conclusion', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(conclusion.message);
    doc.moveDown();

    doc.fontSize(14).text('Dernieres mesures (20)', { underline: true });
    doc.moveDown(0.5);

    const latest = [...measurements].slice(-20).reverse();
    latest.forEach((m, index) => {
      doc.fontSize(10).text(`${index + 1}. ${new Date(m.date).toLocaleString('fr-FR')} -> ${Number(m.value)}`);
    });

    doc.end();
    return null;
  } catch (error) {
    return next(error);
  }
};

