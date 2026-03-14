import { Router } from 'express';
import { createProcess, getProcesses } from '../controllers/process.controller.js';

const router = Router();

router.get('/', getProcesses);
router.post('/', createProcess);

export default router;
