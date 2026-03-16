/**
 * Migration: rename 'vendors' collection → 'remitters'
 * and rename 'vendorId' / 'favoriteVendors' fields across related collections.
 *
 * Run once:  npx ts-node src/migrate-vendor-collection.ts
 */
import mongoose from 'mongoose';
import { config } from './config';

async function main() {
  await mongoose.connect(config.mongodbUri);
  const db = mongoose.connection.db!;

  // 1. Move documents from 'vendors' → 'remitters'
  const hasVendors = (await db.listCollections({ name: 'vendors' }).toArray()).length > 0;
  const hasRemitters = (await db.listCollections({ name: 'remitters' }).toArray()).length > 0;

  if (hasVendors) {
    if (hasRemitters) {
      // Target already exists (e.g. Mongoose auto-created it).
      // Copy all docs from vendors into remitters, then drop vendors.
      const docs = await db.collection('vendors').find().toArray();
      if (docs.length > 0) {
        await db.collection('remitters').insertMany(docs);
        console.log(`Copied ${docs.length} doc(s) from vendors → remitters.`);
      }
      await db.collection('vendors').drop();
      console.log('Dropped old vendors collection.');
    } else {
      await db.renameCollection('vendors', 'remitters');
      console.log('Renamed collection: vendors → remitters');
    }
  } else {
    console.log('Collection "vendors" not found — may already be renamed.');
  }

  // 2. Rename vendorId → remitterId in remittancerates
  let result = await db.collection('remittancerates').updateMany(
    { vendorId: { $exists: true } },
    { $rename: { vendorId: 'remitterId' } }
  );
  console.log(`remittancerates: renamed vendorId → remitterId in ${result.modifiedCount} doc(s).`);

  // 3. Rename vendorId → remitterId in reviews
  //    Drop the old compound index first (it references 'vendorId')
  const reviewIndexes = await db.collection('reviews').indexes();
  for (const idx of reviewIndexes) {
    if (idx.key && 'vendorId' in idx.key) {
      await db.collection('reviews').dropIndex(idx.name!);
      console.log(`reviews: dropped index "${idx.name}" (contains vendorId).`);
    }
  }
  result = await db.collection('reviews').updateMany(
    { vendorId: { $exists: true } },
    { $rename: { vendorId: 'remitterId' } }
  );
  console.log(`reviews: renamed vendorId → remitterId in ${result.modifiedCount} doc(s).`);

  // 4. Rename vendorId → remitterId in dailyratesnapshots
  result = await db.collection('dailyratesnapshots').updateMany(
    { vendorId: { $exists: true } },
    { $rename: { vendorId: 'remitterId' } }
  );
  console.log(`dailyratesnapshots: renamed vendorId → remitterId in ${result.modifiedCount} doc(s).`);

  // 5. Rename vendorId → remitterId in partners
  result = await db.collection('partners').updateMany(
    { vendorId: { $exists: true } },
    { $rename: { vendorId: 'remitterId' } }
  );
  console.log(`partners: renamed vendorId → remitterId in ${result.modifiedCount} doc(s).`);

  // 6. Rename favoriteVendors → favoriteRemitters in users
  result = await db.collection('users').updateMany(
    { favoriteVendors: { $exists: true } },
    { $rename: { favoriteVendors: 'favoriteRemitters' } }
  );
  console.log(`users: renamed favoriteVendors → favoriteRemitters in ${result.modifiedCount} doc(s).`);

  console.log('\nMigration complete!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
