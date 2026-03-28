import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { spawn } from 'node:child_process';
import User from '../src/models/User.js';
import Process from '../src/models/Process.js';
import Measurement from '../src/models/Measurement.js';
import Alert from '../src/models/Alert.js';
import AuditLog from '../src/models/AuditLog.js';
import CorrectiveAction from '../src/models/CorrectiveAction.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant dans .env');
}

const TEST_USERS = [
  { fullName: 'Alice Martin', email: 'manager@pfe.com', password: 'Manager123!', role: 'manager' },
  { fullName: 'Bob Dupont', email: 'quality@pfe.com', password: 'Quality123!', role: 'quality' },
  { fullName: 'Clara Benali', email: 'operator@pfe.com', password: 'Operator123!', role: 'operator' },
];

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptPath} exited with code ${code}`));
      }
    });
  });
}

async function ensureTestUsers() {
  let created = 0;

  for (const entry of TEST_USERS) {
    const existing = await User.findOne({ email: entry.email.toLowerCase() });
    if (existing) continue;

    const hashed = await bcrypt.hash(entry.password, 10);
    await User.create({
      fullName: entry.fullName,
      email: entry.email.toLowerCase(),
      password: hashed,
      role: entry.role,
      isActive: true,
    });
    created += 1;
  }

  return created;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const usersBefore = await User.countDocuments({});

  // Keep users, clear all other app data.
  const [processesDeleted, measurementsDeleted, alertsDeleted, auditsDeleted, correctiveDeleted] = await Promise.all([
    Process.deleteMany({}),
    Measurement.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({}),
    CorrectiveAction.deleteMany({}),
  ]);

  const usersCreated = await ensureTestUsers();
  const usersAfter = await User.countDocuments({});

  await mongoose.disconnect();

  console.log('--- Cleanup summary ---');
  console.log(`Users kept: ${usersBefore} -> ${usersAfter} (created: ${usersCreated})`);
  console.log(`Processes deleted: ${processesDeleted.deletedCount}`);
  console.log(`Measurements deleted: ${measurementsDeleted.deletedCount}`);
  console.log(`Alerts deleted: ${alertsDeleted.deletedCount}`);
  console.log(`Audit logs deleted: ${auditsDeleted.deletedCount}`);
  console.log(`Corrective actions deleted: ${correctiveDeleted.deletedCount}`);

  console.log('\nNow seeding test data for processes/measurements/alerts...');
  await runNodeScript('scripts/seed-dashboard.js');

  console.log('\nDone. Database reset completed (users preserved).');
  console.log('\nDefault test users (if they did not already exist):');
  console.log('- manager@pfe.com / Manager123!');
  console.log('- quality@pfe.com / Quality123!');
  console.log('- operator@pfe.com / Operator123!');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
