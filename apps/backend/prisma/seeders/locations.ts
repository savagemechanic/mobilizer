import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface StateData {
  id: number;
  name: string;
  abbreviation: string;
}

interface LGAData {
  id: number;
  stateId: number;
  name: string;
  abbreviation: string;
}

interface WardData {
  id: number;
  lgaId: number;
  name: string;
  abbreviation: string;
}

interface PollingUnitData {
  id: number;
  wardId: number;
  name: string;
  abbreviation: string;
  delimitation: string;
}

/**
 * Parse SQL INSERT statements into data objects
 */
function parseSQLInsert(line: string): any[] {
  const valueMatch = line.match(/VALUES?\s*(.+)/i);
  if (!valueMatch) return [];

  const valuesString = valueMatch[1];
  const rows: any[] = [];

  // Match all value tuples: (value1,value2,value3,...)
  const tupleRegex = /\(([^)]+)\)/g;
  let match;

  while ((match = tupleRegex.exec(valuesString)) !== null) {
    const values = match[1].split(',').map(v => {
      v = v.trim();
      // Remove quotes and handle NULL
      if (v.toLowerCase() === 'null') return null;
      if (v.startsWith("'") && v.endsWith("'")) {
        return v.substring(1, v.length - 1);
      }
      return v;
    });
    rows.push(values);
  }

  return rows;
}

/**
 * Seed Nigerian states from SQL file
 */
async function seedStates(sqlFilePath: string, nigeria: any): Promise<Map<number, string>> {
  console.log('Seeding states...');

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const statesMap = new Map<number, string>(); // oldId -> newUUID
  let inStatesSection = false;
  let buffer = '';

  for await (const line of rl) {
    if (line.includes('CREATE TABLE `states`')) {
      inStatesSection = true;
      continue;
    }

    if (inStatesSection && line.includes('INSERT INTO `states`')) {
      buffer += line;

      // If line ends with semicolon, process it
      if (line.trim().endsWith(';')) {
        const rows = parseSQLInsert(buffer);

        for (const row of rows) {
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

        console.log(`Inserted ${rows.length} states`);
        buffer = '';
        inStatesSection = false;
      }
    } else if (inStatesSection && !line.trim().startsWith('--')) {
      buffer += ' ' + line;
    }

    // Stop reading after states section
    if (inStatesSection === false && statesMap.size > 0) {
      break;
    }
  }

  console.log(`Total states seeded: ${statesMap.size}`);
  return statesMap;
}

/**
 * Seed LGAs from SQL file
 */
async function seedLGAs(
  sqlFilePath: string,
  statesMap: Map<number, string>
): Promise<Map<number, string>> {
  console.log('Seeding LGAs...');

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lgasMap = new Map<number, string>(); // oldId -> newUUID
  let inLGASection = false;
  let buffer = '';
  let count = 0;

  for await (const line of rl) {
    if (line.includes('CREATE TABLE `local_governments`')) {
      inLGASection = true;
      continue;
    }

    if (inLGASection && line.includes('INSERT INTO `local_governments`')) {
      buffer += line;
      continue;
    }

    if (inLGASection && buffer && line.trim()) {
      buffer += ' ' + line;

      // Process when we hit a comma-separated values line or semicolon
      if (line.trim().endsWith(';') || line.trim().endsWith(',')) {
        // Parse accumulated buffer
        const rows = parseSQLInsert(buffer);

        for (const row of rows) {
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
              count++;

              if (count % 50 === 0) {
                console.log(`Inserted ${count} LGAs...`);
              }
            } catch (error) {
              console.error(`Error inserting LGA: ${name} (${abbreviation})`, error);
            }
          }
        }

        if (line.trim().endsWith(';')) {
          buffer = '';
          inLGASection = false;
          break;
        } else {
          buffer = '';
        }
      }
    }
  }

  console.log(`Total LGAs seeded: ${lgasMap.size}`);
  return lgasMap;
}

/**
 * Seed Wards (Registration Areas) from SQL file
 */
async function seedWards(
  sqlFilePath: string,
  lgasMap: Map<number, string>
): Promise<Map<number, string>> {
  console.log('Seeding wards (registration areas)...');

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const wardsMap = new Map<number, string>(); // oldId -> newUUID
  let inWardSection = false;
  let buffer = '';
  let count = 0;

  for await (const line of rl) {
    if (line.includes('CREATE TABLE `registration_areas`')) {
      inWardSection = true;
      continue;
    }

    if (inWardSection && line.includes('INSERT INTO `registration_areas`')) {
      buffer += line;
      continue;
    }

    if (inWardSection && buffer && line.trim()) {
      buffer += ' ' + line;

      // Process when we hit semicolon or continue building
      if (line.trim().endsWith(';') || (line.trim().endsWith(',') && buffer.length > 10000)) {
        const rows = parseSQLInsert(buffer);

        for (const row of rows) {
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
              count++;

              if (count % 100 === 0) {
                console.log(`Inserted ${count} wards...`);
              }
            } catch (error) {
              console.error(`Error inserting ward: ${name} (${abbreviation}) for LGA ${oldLgaId}`, error);
            }
          }
        }

        if (line.trim().endsWith(';')) {
          buffer = '';
          inWardSection = false;
          break;
        } else {
          buffer = '';
        }
      }
    }
  }

  console.log(`Total wards seeded: ${wardsMap.size}`);
  return wardsMap;
}

/**
 * Seed Polling Units from SQL file
 */
async function seedPollingUnits(
  sqlFilePath: string,
  wardsMap: Map<number, string>
): Promise<void> {
  console.log('Seeding polling units...');

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let inPUSection = false;
  let buffer = '';
  let count = 0;
  const BATCH_SIZE = 100;
  let batch: any[] = [];

  for await (const line of rl) {
    if (line.includes('CREATE TABLE `polling_units`')) {
      inPUSection = true;
      continue;
    }

    if (inPUSection && line.includes('INSERT INTO `polling_units`')) {
      buffer += line;
      continue;
    }

    if (inPUSection && buffer && line.trim()) {
      buffer += ' ' + line;

      // Process in batches to improve performance
      if (line.trim().endsWith(',') && buffer.length > 5000) {
        const rows = parseSQLInsert(buffer);

        for (const row of rows) {
          const [oldId, oldWardId, name, abbreviation, delimitation] = row;
          const wardId = wardsMap.get(parseInt(oldWardId));

          if (wardId) {
            batch.push({
              wardId,
              name,
              code: abbreviation,
            });

            if (batch.length >= BATCH_SIZE) {
              await insertPollingUnitsBatch(batch);
              count += batch.length;
              console.log(`Inserted ${count} polling units...`);
              batch = [];
            }
          }
        }

        buffer = '';
      } else if (line.trim().endsWith(';')) {
        const rows = parseSQLInsert(buffer);

        for (const row of rows) {
          const [oldId, oldWardId, name, abbreviation, delimitation] = row;
          const wardId = wardsMap.get(parseInt(oldWardId));

          if (wardId) {
            batch.push({
              wardId,
              name,
              code: abbreviation,
            });
          }
        }

        // Insert remaining batch
        if (batch.length > 0) {
          await insertPollingUnitsBatch(batch);
          count += batch.length;
          console.log(`Inserted ${count} polling units...`);
        }

        inPUSection = false;
        break;
      }
    }
  }

  console.log(`Total polling units seeded: ${count}`);
}

/**
 * Insert polling units in batch
 */
async function insertPollingUnitsBatch(batch: any[]): Promise<void> {
  for (const pu of batch) {
    try {
      await prisma.pollingUnit.upsert({
        where: { wardId_code: { wardId: pu.wardId, code: pu.code } },
        update: { name: pu.name },
        create: pu,
      });
    } catch (error) {
      // Silently continue on duplicate key errors
      if (!error.message?.includes('Unique constraint')) {
        console.error(`Error inserting polling unit: ${pu.name}`, error);
      }
    }
  }
}

/**
 * Main location seeding function
 */
export async function seedLocations(): Promise<void> {
  const sqlFilePath = path.join(__dirname, '../../../location_lookups.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`SQL file not found at: ${sqlFilePath}`);
    console.error('Please ensure location_lookups.sql is in the project root directory');
    return;
  }

  console.log('========================================');
  console.log('SEEDING NIGERIAN LOCATIONS');
  console.log('========================================\n');

  // Create Nigeria first
  const nigeria = await prisma.country.upsert({
    where: { code: 'NG' },
    update: {},
    create: {
      name: 'Nigeria',
      code: 'NG',
    },
  });
  console.log('Created country: Nigeria\n');

  try {
    // Seed in hierarchical order
    const statesMap = await seedStates(sqlFilePath, nigeria);
    const lgasMap = await seedLGAs(sqlFilePath, statesMap);
    const wardsMap = await seedWards(sqlFilePath, lgasMap);
    await seedPollingUnits(sqlFilePath, wardsMap);

    console.log('\n========================================');
    console.log('LOCATION SEEDING COMPLETED!');
    console.log('========================================');
    console.log(`States: ${statesMap.size}`);
    console.log(`LGAs: ${lgasMap.size}`);
    console.log(`Wards: ${wardsMap.size}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Error during location seeding:', error);
    throw error;
  }
}

// Allow running this seeder independently
if (require.main === module) {
  seedLocations()
    .catch((e) => {
      console.error('Error during location seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
