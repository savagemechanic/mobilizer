import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Extract all INSERT values from a SQL dump for a specific table
 */
function extractTableData(sqlContent: string, tableName: string): string[][] {
  // Match ALL INSERT INTO statements for this table (using global flag)
  // Some tables have multiple INSERT statements
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
  let skippedChars = 0;
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
      // This should rarely happen - log if it does
      skippedChars++;
      i++;
    }
  }

  console.log(`  Parsed ${rows.length} rows`);

  return rows;
}

/**
 * Seed all Nigerian locations from SQL file
 */
export async function seedLocations(): Promise<void> {
  // Try multiple possible locations for the SQL file
  const possiblePaths = [
    path.join(__dirname, '../../../location_lookups.sql'),       // Project root
    path.join(__dirname, '../../../../location_lookups.sql'),    // Monorepo root
    path.join(__dirname, '../../../../apps/location_lookups.sql'), // apps/ directory
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
  console.log('SEEDING NIGERIAN LOCATIONS');
  console.log('========================================\n');
  console.log('Reading SQL file (this may take a moment)...\n');

  // Read entire file (it's large but manageable for one-time seed)
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Create Nigeria first
  const nigeria = await prisma.country.upsert({
    where: { code: 'NG' },
    update: {},
    create: {
      name: 'Nigeria',
      code: 'NG',
    },
  });
  console.log('✓ Created country: Nigeria\n');

  try {
    // 1. SEED STATES
    console.log('Seeding states...');
    const statesData = extractTableData(sqlContent, 'states');
    const statesMap = new Map<number, string>(); // oldId -> newUUID

    for (const row of statesData) {
      const [oldId, name, abbreviation] = row;

      const state = await prisma.state.upsert({
        where: { countryId_code: { countryId: nigeria.id, code: abbreviation } },
        update: { name },
        create: {
          countryId: nigeria.id,
          name,
          code: abbreviation,
        },
      });

      statesMap.set(parseInt(oldId), state.id);
    }
    console.log(`✓ Seeded ${statesMap.size} states\n`);

    // 2. SEED LGAs
    console.log('Seeding LGAs...');
    const lgasData = extractTableData(sqlContent, 'local_governments');
    const lgasMap = new Map<number, string>(); // oldId -> newUUID
    let lgaCount = 0;

    for (const row of lgasData) {
      const [oldId, oldStateId, name, abbreviation] = row;
      const stateId = statesMap.get(parseInt(oldStateId));

      if (stateId) {
        try {
          const lga = await prisma.lGA.upsert({
            where: { stateId_code: { stateId, code: abbreviation } },
            update: { name },
            create: {
              stateId,
              name,
              code: abbreviation,
            },
          });

          lgasMap.set(parseInt(oldId), lga.id);
          lgaCount++;

          if (lgaCount % 100 === 0) {
            console.log(`  Inserted ${lgaCount} LGAs...`);
          }
        } catch (error) {
          console.error(`  Error inserting LGA: ${name} (${abbreviation})`, error.message);
        }
      }
    }
    console.log(`✓ Seeded ${lgasMap.size} LGAs\n`);

    // 3. SEED WARDS (Registration Areas)
    console.log('Seeding wards (registration areas)...');
    const wardsData = extractTableData(sqlContent, 'registration_areas');
    const wardsMap = new Map<number, string>(); // oldId -> newUUID
    let wardCount = 0;

    for (const row of wardsData) {
      const [oldId, oldLgaId, name, abbreviation] = row;
      const lgaId = lgasMap.get(parseInt(oldLgaId));

      if (lgaId) {
        try {
          const ward = await prisma.ward.upsert({
            where: { lgaId_code: { lgaId, code: abbreviation } },
            update: { name },
            create: {
              lgaId,
              name,
              code: abbreviation,
            },
          });

          wardsMap.set(parseInt(oldId), ward.id);
          wardCount++;

          if (wardCount % 500 === 0) {
            console.log(`  Inserted ${wardCount} wards...`);
          }
        } catch (error) {
          console.error(`  Error inserting ward: ${name} for LGA ${oldLgaId}`, error.message);
        }
      }
    }
    console.log(`✓ Seeded ${wardsMap.size} wards\n`);

    // 4. SEED POLLING UNITS
    console.log('Seeding polling units (this will take a while)...');
    const pollingUnitsData = extractTableData(sqlContent, 'polling_units');
    let puCount = 0;
    const BATCH_SIZE = 500;
    let batch: any[] = [];

    for (const row of pollingUnitsData) {
      const [oldId, oldWardId, name, abbreviation, delimitation] = row;
      const wardId = wardsMap.get(parseInt(oldWardId));

      if (wardId) {
        batch.push({
          wardId,
          name,
          code: abbreviation,
        });

        if (batch.length >= BATCH_SIZE) {
          // Process batch
          for (const pu of batch) {
            try {
              await prisma.pollingUnit.upsert({
                where: { wardId_code: { wardId: pu.wardId, code: pu.code } },
                update: { name: pu.name },
                create: pu,
              });
              puCount++;
            } catch (error) {
              // Skip duplicates silently
              if (!error.message?.includes('Unique constraint')) {
                console.error(`  Error inserting PU: ${pu.name}`, error.message);
              }
            }
          }

          console.log(`  Inserted ${puCount} polling units...`);
          batch = [];
        }
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      for (const pu of batch) {
        try {
          await prisma.pollingUnit.upsert({
            where: { wardId_code: { wardId: pu.wardId, code: pu.code } },
            update: { name: pu.name },
            create: pu,
          });
          puCount++;
        } catch (error) {
          if (!error.message?.includes('Unique constraint')) {
            console.error(`  Error inserting PU: ${pu.name}`, error.message);
          }
        }
      }
    }
    console.log(`✓ Seeded ${puCount} polling units\n`);

    console.log('========================================');
    console.log('LOCATION SEEDING COMPLETED!');
    console.log('========================================');
    console.log(`✓ States: ${statesMap.size}`);
    console.log(`✓ LGAs: ${lgasMap.size}`);
    console.log(`✓ Wards: ${wardsMap.size}`);
    console.log(`✓ Polling Units: ${puCount}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Error during location seeding:', error);
    throw error;
  }
}

// Allow running this seeder independently
if (require.main === module) {
  console.log('Starting location seed...\n');

  seedLocations()
    .catch((e) => {
      console.error('\n❌ Error during location seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
