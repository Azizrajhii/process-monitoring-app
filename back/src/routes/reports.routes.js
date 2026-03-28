import { Router } from 'express';
import {
	compareProcessPeriods,
	exportProcessReportCsv,
	exportProcessReportPdf,
	getProcessReport,
	getProcessReportHistory,
	getCpkEvolution7Days,
	getIncapableRate7Days
} from '../controllers/reports.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();


router.get('/process/:id', protect, restrictTo('manager', 'quality'), getProcessReport);
router.get('/process/:id/history', protect, restrictTo('manager', 'quality'), getProcessReportHistory);
router.get('/process/:id/compare', protect, restrictTo('manager', 'quality'), compareProcessPeriods);
router.get('/process/:id/export.csv', protect, restrictTo('manager', 'quality'), exportProcessReportCsv);
router.get('/process/:id/export.pdf', protect, restrictTo('manager', 'quality'), exportProcessReportPdf);

// Nouveau endpoint: évolution Cpk 7 jours (tous process)
router.get('/cpk-evolution-7days', protect, restrictTo('manager', 'quality'), getCpkEvolution7Days);

// Nouveau endpoint: taux de process non capable 7 jours
router.get('/incapable-rate-7days', protect, restrictTo('manager', 'quality'), getIncapableRate7Days);

export default router;