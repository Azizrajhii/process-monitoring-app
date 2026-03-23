import 'dotenv/config';
import mongoose from 'mongoose';
import Alert from '../src/models/Alert.js';
import Measurement from '../src/models/Measurement.js';
import Process from '../src/models/Process.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant dans .env');
}

const PROCESS_SEEDS = [
  { name: 'Conditionnement A', productionLine: 'L1', status: 'active' },
  { name: 'Assemblage B', productionLine: 'L2', status: 'active' },
  { name: 'Controle C', productionLine: 'L3', status: 'active' },
  { name: 'Finition D', productionLine: 'L4', status: 'inactive' },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = (arr) => arr[randomInt(0, arr.length - 1)];

async function ensureProcesses() {
  const existing = await Process.find({}).select('_id name').lean();
  if (existing.length > 0) {
    return existing;
  }

  const created = await Process.insertMany(PROCESS_SEEDS);
  return created.map((p) => ({ _id: p._id, name: p.name }));
}

async function seedMeasurements(processes) {
  await Measurement.deleteMany({});

  const docs = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 90; dayOffset += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);

    for (const process of processes) {
      const dailyCount = randomInt(6, 20);
      for (let i = 0; i < dailyCount; i += 1) {
        docs.push({
          process: process._id,
          value: Number((Math.random() * 20 + 80).toFixed(2)),
          date: new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            randomInt(6, 22),
            randomInt(0, 59),
            randomInt(0, 59),
          ),
        });
      }
    }
  }

  await Measurement.insertMany(docs);
  return docs.length;
}

async function seedAlerts(processes) {
  await Alert.deleteMany({});

  const types = ['cpk_low', 'limit_exceeded', 'trend_anomaly'];
  const statuses = ['treated', 'not_treated'];
  const docs = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 90; dayOffset += 1) {
    const count = randomInt(0, 5);
    for (let i = 0; i < count; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);

      const type = randomFrom(types);
      docs.push({
        process: randomFrom(processes)._id,
        type,
        message: `Alert ${type} detected`,
        status: randomFrom(statuses),
        date: new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          randomInt(6, 22),
          randomInt(0, 59),
          randomInt(0, 59),
        ),
      });
    }
  }

  if (docs.length > 0) {
    await Alert.insertMany(docs);
  }
  return docs.length;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const processes = await ensureProcesses();
  const measurementCount = await seedMeasurements(processes);
  const alertCount = await seedAlerts(processes);

  console.log(`Seed done: ${processes.length} process(es), ${measurementCount} measurement(s), ${alertCount} alert(s)`);

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
