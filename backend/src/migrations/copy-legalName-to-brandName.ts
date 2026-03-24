/**
 * Migration: Copy `legalName` → `brandName` for existing remitters that don't have brandName set.
 *
 * Run:
 *   npx ts-node src/migrations/copy-legalName-to-brandName.ts
 */
import mongoose from 'mongoose';
import { config } from '../config/index';

async function main() {
  await mongoose.connect(config.mongodbUri);
  const db = mongoose.connection.db!;
  const col = db.collection('remitters');

  const result = await col.updateMany(
    { $or: [{ brandName: { $exists: false } }, { brandName: '' }] },
    [{ $set: { brandName: '$legalName' } }],
  );

  console.log(`Updated ${result.modifiedCount} remitter(s): copied legalName → brandName`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
