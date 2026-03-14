import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Backend démarré sur http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Erreur au démarrage du serveur:', error.message);
  process.exit(1);
});
