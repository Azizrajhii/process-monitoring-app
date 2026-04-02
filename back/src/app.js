import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { auditMiddleware } from './services/audit.service.js';
import { corsOrigin } from './config/cors.js';

const app = express();

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API backend opérationnelle',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', auditMiddleware);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
