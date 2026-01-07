import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

  // Get all delimitations from source
  const puDataStart = sqlContent.indexOf('INSERT INTO `pu_data`');
  const puDataSection = sqlContent.substring(puDataStart);
  const delimRegex = /\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*'([^']+)'/g;

  const sourceDelims = new Set<string>();
  let match;
  while ((match = delimRegex.exec(puDataSection)) !== null) {
    sourceDelims.add(match[1]);
  }
  console.log(`Source delimitations: ${sourceDelims.size}`);

  // Get all delimitations from database
  const dbDelims = await prisma.pollingUnit.findMany({
    select: { delimitation: true },
    where: { delimitation: { not: null } }
  });
  const dbDelimSet = new Set(dbDelims.map(d => d.delimitation));
  console.log(`Database delimitations: ${dbDelimSet.size}`);

  // Find missing
  const missing: string[] = [];
  sourceDelims.forEach(d => {
    if (!dbDelimSet.has(d)) {
      missing.push(d);
    }
  });

  console.log(`\nMissing delimitations: ${missing.length}`);

  if (missing.length > 0) {
    // Group by state code
    const byState = new Map<string, number>();
    missing.forEach(d => {
      const state = d.split('-')[0];
      byState.set(state, (byState.get(state) || 0) + 1);
    });

    console.log('\nMissing by state:');
    [...byState.entries()].sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`);
    });

    console.log('\nSample missing delimitations:');
    missing.slice(0, 30).forEach(d => console.log(`  ${d}`));
  }

  await prisma.$disconnect();
}

check();
