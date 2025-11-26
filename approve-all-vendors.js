// Quick script to approve all vendors for testing
// Run with: node approve-all-vendors.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/localsewa';

async function approveAllVendors() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const ServiceProvider = mongoose.model('ServiceProvider', new mongoose.Schema({}, { strict: false }));

    console.log('📋 Finding all vendors...');
    const vendors = await ServiceProvider.find({});
    console.log(`Found ${vendors.length} vendors`);

    console.log('✅ Approving all vendors...');
    const result = await ServiceProvider.updateMany(
      {},
      { $set: { isApproved: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} vendors`);
    console.log('✅ All vendors are now approved!');

    // Show updated vendors
    const updated = await ServiceProvider.find({}, { name: 1, email: 1, isApproved: 1 });
    console.log('\n📊 Vendor Status:');
    updated.forEach(vendor => {
      console.log(`  - ${vendor.name} (${vendor.email}): ${vendor.isApproved ? '✅ Approved' : '❌ Not Approved'}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done! All vendors approved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

approveAllVendors();
