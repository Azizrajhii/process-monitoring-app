import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI manquant dans .env');

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ['operator', 'quality', 'manager'], default: 'operator' },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const users = [
  { fullName: 'Alice Martin',  email: 'manager@pfe.com',  password: 'Manager123!',  role: 'manager'  },
  { fullName: 'Bob Dupont',    email: 'quality@pfe.com',   password: 'Quality123!',   role: 'quality'  },
  { fullName: 'Clara Benali',  email: 'operator@pfe.com',  password: 'Operator123!',  role: 'operator' },
  { fullName: 'David Leclerc', email: 'operator2@pfe.com', password: 'Operator456!',  role: 'operator' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✔  Connecté à MongoDB');

  const deleted = await User.deleteMany({});
  console.log(`🗑  ${deleted.deletedCount} utilisateur(s) supprimé(s)`);

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
  }

  console.log('\n✅  Utilisateurs créés :\n');
  console.log('┌─────────────────────────┬──────────────────────────┬──────────────────┬──────────┐');
  console.log('│ Nom                     │ Email                    │ Mot de passe     │ Rôle     │');
  console.log('├─────────────────────────┼──────────────────────────┼──────────────────┼──────────┤');
  for (const u of users) {
    const row = `│ ${u.fullName.padEnd(23)} │ ${u.email.padEnd(24)} │ ${u.password.padEnd(16)} │ ${u.role.padEnd(8)} │`;
    console.log(row);
  }
  console.log('└─────────────────────────┴──────────────────────────┴──────────────────┴──────────┘');

  await mongoose.disconnect();
  console.log('\n✔  Déconnecté.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
