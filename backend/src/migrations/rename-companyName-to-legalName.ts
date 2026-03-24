/**
 * Migration: Rename `companyName` → `legalName` in the remitters collection.
 *
 * Run once against your database:
 *   npx ts-node src/migrations/rename-companyName-to-legalName.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

async function migrate() {
  if (!MONGO_URI) {
    console.error('No MONGODB_URI / MONGO_URI found in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const remitters = db.collection('remitters');

  // Rename the field in all documents that still have the old name
  const result = await remitters.updateMany(
    { companyName: { $exists: true } },
    { $rename: { companyName: 'legalName' } },
  );

  console.log(`Updated ${result.modifiedCount} document(s) — renamed companyName → legalName`);
  await mongoose.disconnect();
  console.log('Done');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
