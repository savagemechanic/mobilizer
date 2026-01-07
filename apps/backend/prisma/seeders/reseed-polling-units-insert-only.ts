import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Extract all INSERT values from a SQL dump for a specific table
 */
function extractTableData(sqlContent: string, tableName: string): string[][] {
  const tableRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]+?)\\s*;\\s*(?:\\n|$)`,
    'gim'
  );

  const matches = Array.from(sqlContent.matchAll(tableRegex));
  if (matches.length === 0) {
    console.log(`No data found for table: ${tableName}`);
    return [];
  }

  const combinedValues = matches.map(m => m[1]).join(',\n');
  const valuesBlock = combinedValues;
  console.log(`  Combined values block: ${valuesBlock.length} chars`);
  const rows: string[][] = [];

  let i = 0;
  while (i < valuesBlock.length) {
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) {
      i++;
    }

    if (i >= valuesBlock.length) break;

    if (valuesBlock[i] === '(') {
      i++;
      let tupleContent = '';
      let inQuotes = false;
      let quoteChar = '';
      let depth = 1;

      while (i < valuesBlock.length && depth > 0) {
        const char = valuesBlock[i];

        if ((char === "'" || char === '"') && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
          tupleContent += char;
        } else if (char === quoteChar && inQuotes) {
          if (i > 0 && valuesBlock[i - 1] === '\\') {
            tupleContent += char;
          } else {
            inQuotes = false;
            quoteChar = '';
            tupleContent += char;
          }
        } else if (char === '(' && !inQuotes) {
          depth++;
          tupleContent += char;
        } else if (char === ')' && !inQuotes) {
          depth--;
          if (depth > 0) tupleContent += char;
        } else {
          tupleContent += char;
        }

        i++;
      }

      const values: string[] = [];
      let currentValue = '';
      inQuotes = false;
      quoteChar = '';

      for (let j = 0; j < tupleContent.length; j++) {
        const char = tupleContent[j];
        const nextChar = tupleContent[j + 1];

        if ((char === "'" || char === '"') && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          if (j > 0 && tupleContent[j - 1] === '\\') {
            currentValue += char;
          } else if (nextChar === quoteChar) {
            currentValue += char;
            j++;
          } else {
            inQuotes = false;
            quoteChar = '';
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      const cleanedValues = values.map((v) => {
        v = v.trim();
        if (v.toLowerCase() === 'null') return null;
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
          return v.substring(1, v.length - 1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
        }
        return v;
      });

      rows.push(cleanedValues);
    } else {
      i++;
    }
  }

  console.log(`  Parsed ${rows.length} rows`);
  return rows;
}

/**
 * Insert polling units from pu_data (assumes table is already empty)
 */
export async function insertPollingUnits(): Promise<void> {
  const possiblePaths = [
    path.join(__dirname, '../../../../apps/location_lookups.sql'),
    path.join(__dirname, '../../../location_lookups.sql'),
    path.join(__dirname, '../../../../location_lookups.sql'),
    '/tmp/location_data/location_lookups.sql',
  ];

  let sqlFilePath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      sqlFilePath = possiblePath;
      break;
    }
  }

  if (!sqlFilePath) {
    console.error('SQL file not found.');
    return;
  }

  console.log(`Found SQL file at: ${sqlFilePath}\n`);
  console.log('========================================');
  console.log('INSERTING POLLING UNITS WITH DELIMITATION');
  console.log('========================================\n');

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  try {
    // Build location lookup maps
    console.log('Building location lookup maps...\n');

    const states = await prisma.state.findMany({
      select: { id: true, code: true },
    });
    const statesByCode = new Map<string, string>();
    states.forEach(s => statesByCode.set(s.code, s.id));
    console.log(`  Found ${states.length} states in database`);

    const lgas = await prisma.lGA.findMany({
      select: { id: true, code: true, stateId: true },
    });
    const lgasByStateAndCode = new Map<string, string>();
    lgas.forEach(l => lgasByStateAndCode.set(`${l.stateId}:${l.code}`, l.id));
    console.log(`  Found ${lgas.length} LGAs in database`);

    const wards = await prisma.ward.findMany({
      select: { id: true, code: true, lgaId: true },
    });
    const wardsByLgaAndCode = new Map<string, string>();
    wards.forEach(w => wardsByLgaAndCode.set(`${w.lgaId}:${w.code}`, w.id));
    console.log(`  Found ${wards.length} wards in database`);

    // Parse pu_data
    console.log('\nParsing pu_data table...');
    const puData = extractTableData(sqlContent, 'pu_data');

    if (puData.length === 0) {
      console.error('No pu_data found!');
      return;
    }

    console.log(`\nSeeding ${puData.length} polling units...\n`);

    let successCount = 0;
    let skipCount = 0;
    const BATCH_SIZE = 1000;
    let batch: Array<{
      wardId: string;
      name: string;
      code: string;
      delimitation: string;
    }> = [];

    for (const row of puData) {
      const [id, rid, lid, sid, delim, stateName, lgaName, wardName, puName] = row;

      if (!delim || !puName) {
        skipCount++;
        continue;
      }

      const delimParts = delim.split('-');
      if (delimParts.length !== 4) {
        skipCount++;
        continue;
      }

      const [stateCode, lgaCode, wardCode, puCode] = delimParts;

      const stateId = statesByCode.get(stateCode);
      if (!stateId) {
        skipCount++;
        continue;
      }

      const lgaKey = `${stateId}:${lgaCode}`;
      const lgaId = lgasByStateAndCode.get(lgaKey);
      if (!lgaId) {
        skipCount++;
        continue;
      }

      const wardKey = `${lgaId}:${wardCode}`;
      const wardId = wardsByLgaAndCode.get(wardKey);
      if (!wardId) {
        skipCount++;
        continue;
      }

      batch.push({
        wardId,
        name: puName,
        code: puCode,
        delimitation: delim,
      });

      if (batch.length >= BATCH_SIZE) {
        try {
          const result = await prisma.pollingUnit.createMany({
            data: batch,
            skipDuplicates: true,
          });
          successCount += result.count;
        } catch (error: any) {
          console.error(`  Batch error: ${error.message}`);
        }

        console.log(`  Processed ${successCount + skipCount} / ${puData.length}...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      try {
        const result = await prisma.pollingUnit.createMany({
          data: batch,
          skipDuplicates: true,
        });
        successCount += result.count;
      } catch (error: any) {
        console.error(`  Final batch error: ${error.message}`);
      }
    }

    console.log('\n========================================');
    console.log('POLLING UNIT INSERT COMPLETED!');
    console.log('========================================');
    console.log(`✓ Inserted: ${successCount}`);
    console.log(`⊘ Skipped: ${skipCount}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

if (require.main === module) {
  console.log('Starting polling unit insert...\n');

  insertPollingUnits()
    .catch((e) => {
      console.error('\n❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
