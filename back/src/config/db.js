import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('La variable MONGODB_URI est manquante.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connexion MongoDB établie');
};

export default connectDB;
