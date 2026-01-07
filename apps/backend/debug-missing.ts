import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  // Check specific missing delimitations
  const testDelims = ['22-17-04-006', '23-01-01-001', '24-01-01-001'];

  const states = await prisma.state.findMany({ select: { id: true, code: true, name: true } });
  const statesByCode = new Map<string, { id: string; name: string }>();
  states.forEach(s => statesByCode.set(s.code, { id: s.id, name: s.name }));

  const lgas = await prisma.lGA.findMany({ select: { id: true, code: true, stateId: true, name: true } });
  const lgasByStateAndCode = new Map<string, { id: string; name: string }>();
  lgas.forEach(l => lgasByStateAndCode.set(`${l.stateId}:${l.code}`, { id: l.id, name: l.name }));

  const wards = await prisma.ward.findMany({ select: { id: true, code: true, lgaId: true, name: true } });
  const wardsByLgaAndCode = new Map<string, { id: string; name: string }>();
  wards.forEach(w => wardsByLgaAndCode.set(`${w.lgaId}:${w.code}`, { id: w.id, name: w.name }));

  console.log('States 22, 23, 24 in database:');
  ['22', '23', '24'].forEach(code => {
    const s = statesByCode.get(code);
    console.log(`  ${code}: ${s ? s.name : 'NOT FOUND'}`);
  });

  console.log('\n\nTracing missing delimitations:');
  for (const delim of testDelims) {
    console.log(`\n${delim}:`);
    const [stateCode, lgaCode, wardCode, puCode] = delim.split('-');

    const state = statesByCode.get(stateCode);
    if (!state) {
      console.log(`  ❌ State ${stateCode} NOT FOUND`);
      continue;
    }
    console.log(`  ✓ State: ${state.name} (${state.id})`);

    const lga = lgasByStateAndCode.get(`${state.id}:${lgaCode}`);
    if (!lga) {
      console.log(`  ❌ LGA ${lgaCode} NOT FOUND in state ${state.id}`);

      // List LGAs in this state
      const stateLgas = [...lgasByStateAndCode.entries()]
        .filter(([k]) => k.startsWith(state.id + ':'))
        .map(([k, v]) => `${k.split(':')[1]}: ${v.name}`)
        .slice(0, 5);
      console.log(`  Available LGAs: ${stateLgas.join(', ')}...`);
      continue;
    }
    console.log(`  ✓ LGA: ${lga.name} (${lga.id})`);

    const ward = wardsByLgaAndCode.get(`${lga.id}:${wardCode}`);
    if (!ward) {
      console.log(`  ❌ Ward ${wardCode} NOT FOUND in LGA ${lga.id}`);

      // List wards in this LGA
      const lgaWards = [...wardsByLgaAndCode.entries()]
        .filter(([k]) => k.startsWith(lga.id + ':'))
        .map(([k, v]) => `${k.split(':')[1]}: ${v.name}`)
        .slice(0, 5);
      console.log(`  Available wards: ${lgaWards.join(', ')}...`);
      continue;
    }
    console.log(`  ✓ Ward: ${ward.name} (${ward.id})`);
  }

  await prisma.$disconnect();
}

check();
