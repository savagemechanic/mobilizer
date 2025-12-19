/**
 * Standalone script to seed ONLY Nigerian locations
 *
 * This script seeds:
 * - 37 States
 * - 774 Local Government Areas (LGAs)
 * - ~8,800 Wards (Registration Areas)
 * - ~120,000+ Polling Units
 *
 * Usage:
 *   yarn seed:locations
 *   # or
 *   npx ts-node prisma/seeders/seed-locations-only.ts
 *
 * NOTE: This can take 10-15 minutes to complete.
 */

import { PrismaClient } from '@prisma/client';
import { seedLocations } from './locations-batch';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('STANDALONE LOCATION SEEDER');
  console.log('========================================\n');
  console.log('⚠️  This will seed all Nigerian locations:');
  console.log('   - 37 States');
  console.log('   - 774 LGAs');
  console.log('   - ~8,800 Wards');
  console.log('   - ~120,000+ Polling Units\n');
  console.log('⏱️  Estimated time: 10-15 minutes\n');
  console.log('Starting in 3 seconds...\n');

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 3000));

  await seedLocations();

  console.log('\n✅ Location seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during location seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
