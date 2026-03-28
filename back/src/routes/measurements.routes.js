import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getMeasurements,
  getMeasurementById,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
  importMeasurementsCsv,
} from '../controllers/measurement.controller.js';

const router = express.Router();

// All protected routes
router.use(protect);

// GET all measurements (with filters)
router.get('/', getMeasurements);

// POST import measurements from CSV content
router.post('/import-csv', importMeasurementsCsv);

// GET measurement by ID
router.get('/:id', getMeasurementById);

// POST create measurement
router.post('/', createMeasurement);

// PUT update measurement
router.put('/:id', updateMeasurement);

// DELETE measurement
router.delete('/:id', deleteMeasurement);

export default router;
