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
  { name: 'Conditionnement A', productionLine: 'L1', status: 'active', lsl: 88, usl: 92, profile: 'capable' },
  { name: 'Assemblage B', productionLine: 'L2', status: 'active', lsl: 89, usl: 91, profile: 'vigilance' },
  { name: 'Controle C', productionLine: 'L3', status: 'active', lsl: 87, usl: 93, profile: 'capable' },
  { name: 'Finition D', productionLine: 'L4', status: 'inactive', lsl: 90, usl: 94, profile: 'vigilance' },
  { name: 'Decoupe metal - Alerte', productionLine: 'L5', status: 'active', lsl: 9.8, usl: 10.2, profile: 'non_capable' },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = (arr) => arr[randomInt(0, arr.length - 1)];

const randomNormal = (mean, stdDev) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
};

async function ensureProcesses() {
  const profileByName = Object.fromEntries(PROCESS_SEEDS.map((p) => [p.name, p.profile]));
  const existing = await Process.find({}).select('_id name lsl usl').lean();
  if (existing.length > 0) {
    const missingLimits = existing.filter(
      (item) => !Number.isFinite(Number(item.lsl)) || !Number.isFinite(Number(item.usl)),
    );

    if (missingLimits.length > 0) {
      await Process.updateMany(
        { _id: { $in: missingLimits.map((item) => item._id) } },
        { $set: { lsl: 85, usl: 95 } },
      );
    }

    return existing.map((item) => ({
      ...item,
      profile: profileByName[item.name] || 'vigilance',
    }));
  }

  const created = await Process.insertMany(
    PROCESS_SEEDS.map(({ profile, ...doc }) => doc),
  );
  return created.map((p, index) => ({
    _id: p._id,
    name: p.name,
    lsl: p.lsl,
    usl: p.usl,
    profile: PROCESS_SEEDS[index].profile,
  }));
}

async function seedMeasurements(processes) {
  await Measurement.deleteMany({});

  const docs = [];
  const today = new Date();
  const alertProcess = processes.find((p) => p.name === 'Decoupe metal - Alerte');

  for (let dayOffset = 0; dayOffset < 90; dayOffset += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);

    for (const process of processes) {
      const dailyCount = randomInt(6, 20);
      const lsl = Number.isFinite(Number(process.lsl)) ? Number(process.lsl) : 85;
      const usl = Number.isFinite(Number(process.usl)) ? Number(process.usl) : 95;
      const range = usl - lsl;
      const baseCenter = (lsl + usl) / 2;

      let targetSigma;
      let center = baseCenter;

      if (process.profile === 'capable') {
        targetSigma = range / (6 * 1.45);
      } else if (process.profile === 'vigilance') {
        targetSigma = range / (6 * 1.1);
        if (process.name === 'Assemblage B') {
          center = baseCenter + range * 0.12;
        }
      } else {
        targetSigma = range / (6 * 0.6);
        center = usl + Math.max(range * 0.25, 0.08);
      }

      const sigma = Math.max(targetSigma, 0.02);

      for (let i = 0; i < dailyCount; i += 1) {
        docs.push({
          process: process._id,
          value: Number(randomNormal(center, sigma).toFixed(3)),
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

  if (alertProcess) {
    // Inject extra out-of-spec points to guarantee a visible alert scenario in reports.
    for (let i = 0; i < 30; i += 1) {
      docs.push({
        process: alertProcess._id,
        value: Number((10.35 + Math.random() * 0.25).toFixed(3)),
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, i, 0),
      });
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
  const alertProcess = processes.find((p) => p.name === 'Decoupe metal - Alerte');

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

  if (alertProcess) {
    docs.push({
      process: alertProcess._id,
      type: 'cpk_low',
      message: 'Process Decoupe metal - Alerte: Cpk estime < 1.0 (hors limites).',
      status: 'not_treated',
      date: new Date(),
    });
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
