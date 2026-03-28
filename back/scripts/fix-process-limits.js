import 'dotenv/config';
import mongoose from 'mongoose';
import Process from '../src/models/Process.js';

const presets = [
  { name: 'Conditionnement A', lsl: 88, usl: 92 },
  { name: 'Assemblage B', lsl: 89, usl: 91 },
  { name: 'Controle C', lsl: 87, usl: 93 },
  { name: 'Finition D', lsl: 90, usl: 94 },
  { name: 'Decoupe metal - Alerte', lsl: 9.8, usl: 10.2 },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI manquant dans .env');
  }

  await mongoose.connect(uri);

  let updated = 0;
  for (const preset of presets) {
    const result = await Process.updateMany(
      { name: preset.name },
      { $set: { lsl: preset.lsl, usl: preset.usl } },
    );
    updated += result.modifiedCount || 0;
  }

  const docs = await Process.find({})
    .select('name lsl usl cpTarget cpkTarget status')
    .sort({ name: 1 })
    .lean();

  console.log(`UPDATED ${updated}`);
  console.log(JSON.stringify(docs, null, 2));

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
