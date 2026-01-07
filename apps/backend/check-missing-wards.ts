import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

  // Build lookup maps (same as seeder)
  const states = await prisma.state.findMany({ select: { id: true, code: true } });
  const statesByCode = new Map<string, string>();
  states.forEach(s => statesByCode.set(s.code, s.id));

  const lgas = await prisma.lGA.findMany({ select: { id: true, code: true, stateId: true } });
  const lgasByStateAndCode = new Map<string, string>();
  lgas.forEach(l => lgasByStateAndCode.set(`${l.stateId}:${l.code}`, l.id));

  const wards = await prisma.ward.findMany({ select: { id: true, code: true, lgaId: true } });
  const wardsByLgaAndCode = new Map<string, string>();
  wards.forEach(w => wardsByLgaAndCode.set(`${w.lgaId}:${w.code}`, w.id));

  console.log(`States: ${states.length}, LGAs: ${lgas.length}, Wards: ${wards.length}`);

  // Parse pu_data delimitations
  const puDataStart = sqlContent.indexOf('INSERT INTO `pu_data`');
  const puDataSection = sqlContent.substring(puDataStart);
  const delimRegex = /\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*'([^']+)'/g;

  const missingStates = new Set<string>();
  const missingLgas = new Set<string>();
  const missingWards = new Set<string>();
  let total = 0;
  let match;

  while ((match = delimRegex.exec(puDataSection)) !== null) {
    total++;
    const delim = match[1];
    const [stateCode, lgaCode, wardCode, puCode] = delim.split('-');

    const stateId = statesByCode.get(stateCode);
    if (!stateId) {
      missingStates.add(stateCode);
      continue;
    }

    const lgaId = lgasByStateAndCode.get(`${stateId}:${lgaCode}`);
    if (!lgaId) {
      missingLgas.add(`${stateCode}-${lgaCode}`);
      continue;
    }

    const wardId = wardsByLgaAndCode.get(`${lgaId}:${wardCode}`);
    if (!wardId) {
      missingWards.add(`${stateCode}-${lgaCode}-${wardCode}`);
    }
  }

  console.log(`\nTotal PU rows: ${total}`);
  console.log(`Missing states: ${missingStates.size}`, [...missingStates].slice(0, 10));
  console.log(`Missing LGAs: ${missingLgas.size}`, [...missingLgas].slice(0, 10));
  console.log(`Missing wards: ${missingWards.size}`, [...missingWards].slice(0, 10));

  await prisma.$disconnect();
}

check();
