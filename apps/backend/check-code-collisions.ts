import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const sqlContent = fs.readFileSync('/Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/location_lookups.sql', 'utf-8');

  // Build lookup maps
  const states = await prisma.state.findMany({ select: { id: true, code: true } });
  const statesByCode = new Map<string, string>();
  states.forEach(s => statesByCode.set(s.code, s.id));

  const lgas = await prisma.lGA.findMany({ select: { id: true, code: true, stateId: true } });
  const lgasByStateAndCode = new Map<string, string>();
  lgas.forEach(l => lgasByStateAndCode.set(`${l.stateId}:${l.code}`, l.id));

  const wards = await prisma.ward.findMany({ select: { id: true, code: true, lgaId: true } });
  const wardsByLgaAndCode = new Map<string, string>();
  wards.forEach(w => wardsByLgaAndCode.set(`${w.lgaId}:${w.code}`, w.id));

  // Parse pu_data
  const puDataStart = sqlContent.indexOf('INSERT INTO `pu_data`');
  const puDataSection = sqlContent.substring(puDataStart);
  const delimRegex = /\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*'([^']+)'/g;

  const wardCodeCombos = new Map<string, string[]>(); // wardId:code -> [delimitations]
  let match;

  while ((match = delimRegex.exec(puDataSection)) !== null) {
    const delim = match[1];
    const [stateCode, lgaCode, wardCode, puCode] = delim.split('-');

    const stateId = statesByCode.get(stateCode)!;
    const lgaId = lgasByStateAndCode.get(`${stateId}:${lgaCode}`)!;
    const wardId = wardsByLgaAndCode.get(`${lgaId}:${wardCode}`)!;

    const key = `${wardId}:${puCode}`;
    if (!wardCodeCombos.has(key)) {
      wardCodeCombos.set(key, []);
    }
    wardCodeCombos.get(key)!.push(delim);
  }

  const collisions = [...wardCodeCombos.entries()].filter(([k, v]) => v.length > 1);
  console.log(`Total unique wardId:code combos: ${wardCodeCombos.size}`);
  console.log(`Collisions (same wardId+code, different delim): ${collisions.length}`);

  if (collisions.length > 0) {
    console.log('\nSample collisions:');
    collisions.slice(0, 20).forEach(([key, delims]) => {
      console.log(`  ${key}: ${delims.join(', ')}`);
    });
  }

  await prisma.$disconnect();
}

check();
