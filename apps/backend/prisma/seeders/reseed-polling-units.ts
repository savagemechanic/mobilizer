import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Extract all INSERT values from a SQL dump for a specific table
 * Handles complex SQL with quoted strings containing special characters
 */
function extractTableData(sqlContent: string, tableName: string): string[][] {
  // Match ALL INSERT INTO statements for this table (using global flag)
  const tableRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[\\s\\S]*?VALUES\\s*([\\s\\S]+?)\\s*;\\s*(?:\\n|$)`,
    'gim'
  );

  const matches = Array.from(sqlContent.matchAll(tableRegex));
  if (matches.length === 0) {
    console.log(`No data found for table: ${tableName}`);
    return [];
  }

  if (matches.length > 1) {
    console.log(`  Found ${matches.length} INSERT statements for ${tableName}`);
  }

  // Combine all VALUES blocks into one for processing
  const combinedValues = matches.map(m => m[1]).join(',\n');
  const valuesBlock = combinedValues;
  console.log(`  Combined values block: ${valuesBlock.length} chars`);
  const rows: string[][] = [];

  // Extract tuples by parsing character by character to handle nested parens in quotes
  let i = 0;
  while (i < valuesBlock.length) {
    // Skip whitespace and commas
    while (i < valuesBlock.length && /[\s,]/.test(valuesBlock[i])) {
      i++;
    }

    if (i >= valuesBlock.length) break;

    // Look for opening paren
    if (valuesBlock[i] === '(') {
      i++; // Skip opening paren
      let tupleContent = '';
      let inQuotes = false;
      let quoteChar = '';
      let depth = 1; // Track paren depth

      // Extract everything until we find the matching closing paren
      while (i < valuesBlock.length && depth > 0) {
        const char = valuesBlock[i];

        if ((char === "'" || char === '"') && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
          tupleContent += char;
        } else if (char === quoteChar && inQuotes) {
          // Check for backslash escape
          if (i > 0 && valuesBlock[i - 1] === '\\') {
            // Escaped quote, don't close
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

      // Now parse the tuple content into values
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
          // Check for escaped quote (either backslash or double quote)
          if (j > 0 && tupleContent[j - 1] === '\\') {
            // Backslash escaped, don't close
            currentValue += char;
          } else if (nextChar === quoteChar) {
            // Double quote escape
            currentValue += char;
            j++; // Skip next char
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

      // Push the last value
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      // Clean up values
      const cleanedValues = values.map((v) => {
        v = v.trim();
        // Handle NULL
        if (v.toLowerCase() === 'null') return null;
        // Remove quotes
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
 * Reseed polling units using pu_data table from SQL file
 * This provides complete delimitation codes for all polling units
 */
export async function reseedPollingUnits(): Promise<void> {
  // Try multiple possible locations for the SQL file
  const possiblePaths = [
    path.join(__dirname, '../../../../apps/location_lookups.sql'),  // apps/ directory (primary)
    path.join(__dirname, '../../../location_lookups.sql'),           // backend root
    path.join(__dirname, '../../../../location_lookups.sql'),        // monorepo root
    '/tmp/location_data/location_lookups.sql',                       // Extracted location
  ];

  let sqlFilePath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      sqlFilePath = possiblePath;
      break;
    }
  }

  if (!sqlFilePath) {
    console.error('SQL file not found. Tried:');
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    console.error('\nPlease ensure location_lookups.sql exists in one of these locations');
    return;
  }

  console.log(`Found SQL file at: ${sqlFilePath}\n`);

  console.log('========================================');
  console.log('RESEEDING POLLING UNITS WITH DELIMITATION');
  console.log('========================================\n');
  console.log('Reading SQL file (this may take a moment)...\n');

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  try {
    // 1. First, ensure we have states, LGAs, and wards mapped
    console.log('Building location lookup maps...\n');

    // Get existing states from database
    const states = await prisma.state.findMany({
      select: { id: true, code: true, name: true },
    });
    const statesByCode = new Map<string, string>(); // state code -> id
    states.forEach(s => statesByCode.set(s.code, s.id));
    console.log(`  Found ${states.length} states in database`);

    // Get existing LGAs from database
    const lgas = await prisma.lGA.findMany({
      select: { id: true, code: true, stateId: true, name: true },
    });
    // Map: stateId + lgaCode -> lgaId
    const lgasByStateAndCode = new Map<string, string>();
    lgas.forEach(l => lgasByStateAndCode.set(`${l.stateId}:${l.code}`, l.id));
    console.log(`  Found ${lgas.length} LGAs in database`);

    // Get existing wards from database
    const wards = await prisma.ward.findMany({
      select: { id: true, code: true, lgaId: true, name: true },
    });
    // Map: lgaId + wardCode -> wardId
    const wardsByLgaAndCode = new Map<string, string>();
    wards.forEach(w => wardsByLgaAndCode.set(`${w.lgaId}:${w.code}`, w.id));
    console.log(`  Found ${wards.length} wards in database`);

    // 2. Build state code -> state abbreviation map from SQL
    console.log('\nParsing states from SQL...');
    const statesData = extractTableData(sqlContent, 'states');
    const stateOldIdToCode = new Map<string, string>(); // oldId -> abbreviation
    statesData.forEach(row => {
      const [oldId, name, abbreviation] = row;
      stateOldIdToCode.set(oldId, abbreviation);
    });

    // 3. Build LGA old ID -> (stateCode, lgaCode) map from SQL
    console.log('\nParsing LGAs from SQL...');
    const lgasDataFromSql = extractTableData(sqlContent, 'local_governments');
    const lgaOldIdToInfo = new Map<string, { stateCode: string; lgaCode: string }>(); // oldId -> {stateCode, lgaCode}
    lgasDataFromSql.forEach(row => {
      const [oldId, oldStateId, name, abbreviation] = row;
      const stateCode = stateOldIdToCode.get(oldStateId);
      if (stateCode) {
        lgaOldIdToInfo.set(oldId, { stateCode, lgaCode: abbreviation });
      }
    });

    // 4. Build ward old ID -> (stateId, lgaId, wardCode) map from SQL
    console.log('\nParsing wards from SQL...');
    const wardsDataFromSql = extractTableData(sqlContent, 'registration_areas');
    const wardOldIdToInfo = new Map<string, { lgaOldId: string; wardCode: string }>();
    wardsDataFromSql.forEach(row => {
      const [oldId, oldLgaId, name, abbreviation] = row;
      wardOldIdToInfo.set(oldId, { lgaOldId: oldLgaId, wardCode: abbreviation });
    });

    // 5. Clear all foreign key references to polling units before deletion (using raw SQL for speed)
    console.log('\n⚠️  Clearing references to polling units (using raw SQL)...');

    await prisma.$executeRaw`UPDATE users SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL`;
    console.log('  Cleared users');

    await prisma.$executeRaw`UPDATE organizations SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL`;
    console.log('  Cleared organizations');

    await prisma.$executeRaw`UPDATE posts SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL`;
    console.log('  Cleared posts');

    await prisma.$executeRaw`UPDATE events SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL`;
    console.log('  Cleared events');

    await prisma.$executeRaw`UPDATE org_memberships SET "leaderPollingUnitId" = NULL WHERE "leaderPollingUnitId" IS NOT NULL`;
    console.log('  Cleared org_memberships');

    // 6. DELETE all existing polling units (using raw SQL for speed)
    console.log('\n⚠️  Deleting all existing polling units...');
    const deleteResult = await prisma.$executeRaw`DELETE FROM polling_units`;
    console.log(`  Deleted polling units\n`);

    // 7. Parse and seed polling units from pu_data
    console.log('Parsing pu_data table...');
    const puData = extractTableData(sqlContent, 'pu_data');

    if (puData.length === 0) {
      console.error('No pu_data found in SQL file!');
      return;
    }

    console.log(`\nSeeding ${puData.length} polling units with delimitation codes...\n`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    const BATCH_SIZE = 500;
    let batch: Array<{
      wardId: string;
      name: string;
      code: string;
      delimitation: string;
    }> = [];

    for (const row of puData) {
      // pu_data format: (id, rid, lid, sid, delim, state, lga, ward, pu)
      const [id, rid, lid, sid, delim, stateName, lgaName, wardName, puName] = row;

      if (!delim || !puName) {
        skipCount++;
        continue;
      }

      // Parse delimitation to get codes: SS-LL-WW-PPP
      const delimParts = delim.split('-');
      if (delimParts.length !== 4) {
        console.warn(`  Invalid delimitation format: ${delim}`);
        skipCount++;
        continue;
      }

      const [stateCode, lgaCode, wardCode, puCode] = delimParts;

      // Find state ID
      const stateId = statesByCode.get(stateCode);
      if (!stateId) {
        // Try to find by padded code
        const paddedStateCode = stateCode.padStart(2, '0');
        const foundStateId = statesByCode.get(paddedStateCode);
        if (!foundStateId) {
          skipCount++;
          continue;
        }
      }

      // Find LGA ID
      const lgaKey = `${stateId || statesByCode.get(stateCode.padStart(2, '0'))}:${lgaCode}`;
      const lgaId = lgasByStateAndCode.get(lgaKey);
      if (!lgaId) {
        skipCount++;
        continue;
      }

      // Find Ward ID
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
        // Insert batch using createMany for better performance
        try {
          const result = await prisma.pollingUnit.createMany({
            data: batch,
            skipDuplicates: true,
          });
          successCount += result.count;
        } catch (error: any) {
          console.error(`  Batch error: ${error.message}`);
          errorCount += batch.length;
        }

        console.log(`  Processed ${successCount + errorCount + skipCount} / ${puData.length} polling units...`);
        batch = [];
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      try {
        const result = await prisma.pollingUnit.createMany({
          data: batch,
          skipDuplicates: true,
        });
        successCount += result.count;
      } catch (error: any) {
        console.error(`  Final batch error: ${error.message}`);
        errorCount += batch.length;
      }
    }

    console.log('\n========================================');
    console.log('POLLING UNIT RESEEDING COMPLETED!');
    console.log('========================================');
    console.log(`✓ Successfully seeded: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`⊘ Skipped (missing ward/lga/state): ${skipCount}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error during polling unit reseeding:', error);
    throw error;
  }
}

// Allow running this seeder independently
if (require.main === module) {
  console.log('Starting polling unit reseed...\n');

  reseedPollingUnits()
    .catch((e) => {
      console.error('\n❌ Error during polling unit reseed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
