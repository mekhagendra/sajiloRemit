/**
 * Migration: rename user role 'vendor' -> 'remitter'
 * Run once: npx ts-node src/migrate-vendor-to-remitter.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sajiloremit';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI);

  const result = await mongoose.connection
    .collection('users')
    .updateMany({ role: 'vendor' }, { $set: { role: 'remitter' } });

  console.log(`Updated ${result.modifiedCount} user document(s) from role 'vendor' → 'remitter'.`);
  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
