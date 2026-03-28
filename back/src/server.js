import dotenv from 'dotenv';
import http from 'node:http';
import app from './app.js';
import connectDB from './config/db.js';
import { initRealtime } from './services/realtime.service.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initRealtime(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Backend démarré sur http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Erreur au démarrage du serveur:', error.message);
  process.exit(1);
});
