
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Mounted at /api/predict, so define handler at root path.
router.post('/', (req, res) => {
  const { values, usl } = req.body;

  if (!Array.isArray(values) || typeof usl !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Path to your Python script (ESM __dirname workaround)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const scriptPath = path.join(__dirname, '../../ml/predict_next.py');
  const py = spawn('python', [scriptPath]);

  let result = '';
  let error = '';

  py.stdin.write(JSON.stringify({ values }));
  py.stdin.end();

  py.stdout.on('data', (data) => {
    result += data.toString();
  });

  py.stderr.on('data', (data) => {
    error += data.toString();
  });

  py.on('close', (code) => {
    if (error) {
      return res.status(500).json({ error });
    }
    try {
      const output = JSON.parse(result);
      if (output.error) {
        return res.status(400).json({ error: output.error });
      }
      const prediction = output.prediction;
      const status = prediction > usl ? 'WARNING' : 'OK';
      res.json({ prediction, status });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse prediction' });
    }
  });
});

export default router;
