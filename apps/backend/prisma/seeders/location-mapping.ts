import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Manual mapping overrides for LGAs with known naming differences
 * Key: CSV name (uppercase), Value: Database name (uppercase)
 */
const LGA_NAME_OVERRIDES: Record<string, string> = {
  'FUFURE': 'FUFORE',
  'GAYUK': 'GUYUK',
  'DAMBAN': 'DAMBAM',
  'YAKUUR': 'YAKURR',
  'UHUNMWONDE': 'UHUNMWODE',
  'ESIT EKET': 'ESIT-EKET',
  'CALABAR MUNICIPAL': 'CALABAR MUNICIPALITY',
  'MAIDUGURI': 'MAIDUGURI M. C.',
  'NASSARAWA': 'NASARAWA',
  'IFELODUN': 'IFE LODUN',
  'IDEATO SOUTH': 'IDEATO-SOUTH',
  'IDEATO NORTH': 'IDEATO-NORTH',
  'NSIT-ATAI': 'NSIT ATAI',
  'NSIT-IBOM': 'NSIT IBOM',
  'NSIT-UBIUM': 'NSIT UBIUM',
  'MKPAT-ENIN': 'MKPAT ENIN',
  'IBIONO-IBOM': 'IBIONO IBOM',
  'URUE-OFFONG/ORUKO': 'URUE OFFONG ORUKO',
  // Additional overrides for remaining unmatched LGAs
  'MUNICIPAL AREA COUNCIL': 'MUNICIPAL',
  'NAFADA/BAJOGA': 'NAFADA',
  'EZINIHITTE': 'EZINIHITTE MBAISE',
  'KOTON KARFI': 'KOGI . K. K.',
  'SABON BIRNI': 'S/BIRNI',
  'BIRNIN MAGAJI/KIYAW': 'BIRNIN MAGAJI',
};

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\(.*?\)/g, '') // Remove parenthetical content like "(Edda)"
    .replace(/[^A-Z0-9\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find the best matching LGA using fuzzy matching
 */
function findBestMatch(
  csvName: string,
  stateName: string,
  lgasInState: Array<{ id: string; name: string }>
): { id: string; name: string } | null {
  const normalizedCsvName = normalizeName(csvName);

  // Check for manual override first
  const overrideName = LGA_NAME_OVERRIDES[csvName.toUpperCase()];
  if (overrideName) {
    const override = lgasInState.find(
      l => normalizeName(l.name) === normalizeName(overrideName)
    );
    if (override) return override;
  }

  // Try exact match on normalized name
  const exactMatch = lgasInState.find(
    l => normalizeName(l.name) === normalizedCsvName
  );
  if (exactMatch) return exactMatch;

  // Try fuzzy matching with Levenshtein distance
  let bestMatch: { id: string; name: string } | null = null;
  let bestDistance = Infinity;
  const maxAllowedDistance = Math.max(2, Math.floor(normalizedCsvName.length * 0.3)); // Allow up to 30% difference

  for (const lga of lgasInState) {
    const normalizedDbName = normalizeName(lga.name);
    const distance = levenshteinDistance(normalizedCsvName, normalizedDbName);

    if (distance < bestDistance && distance <= maxAllowedDistance) {
      bestDistance = distance;
      bestMatch = lga;
    }
  }

  return bestMatch;
}

interface LGAMapping {
  lgaId: number;
  lgaName: string;
  stateId: number;
  stateName: string;
  composite: string;
  federalConstituency: string;
  federalConstituencyId: number;
  senatorialZone: string;
  senatorialZoneId: number;
  geopoliticalZone: string;
  geopoliticalZoneId: number;
}

/**
 * Parse CSV file and return mapping data
 */
function parseCSV(filePath: string): LGAMapping[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  return dataLines.map(line => {
    // Handle CSV parsing with potential commas in quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return {
      lgaId: parseInt(values[1]) || 0, // New LGA-ID
      lgaName: values[2] || '', // LGA
      stateId: parseInt(values[4]) || 0, // NEW STATE ID
      stateName: values[5] || '', // State
      composite: values[6] || '', // Composite
      federalConstituency: values[9] || '', // Federal Constituency
      federalConstituencyId: parseInt(values[10]) || 0, // Federal_Constituency_ID
      senatorialZone: values[11] || '', // Senatorial Zone
      senatorialZoneId: parseInt(values[12]) || 0, // Senatorial_ID
      geopoliticalZone: values[13] || '', // Geo-Political Zone
      geopoliticalZoneId: parseInt(values[14]) || 0, // Geopolitical_ID
    };
  }).filter(m => m.lgaName && m.stateName);
}

/**
 * Generate a code from a name (for unique constraints)
 */
function generateCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Seed geopolitical zones, senatorial zones, federal constituencies, and update LGAs
 */
export async function seedLocationMapping(): Promise<void> {
  const csvPath = path.join(__dirname, 'lga_mapping.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at:', csvPath);
    console.error('Please ensure lga_mapping.csv exists in the seeders directory');
    return;
  }

  console.log('========================================');
  console.log('SEEDING LOCATION MAPPING');
  console.log('========================================\n');

  const mappings = parseCSV(csvPath);
  console.log(`Parsed ${mappings.length} LGA mappings from CSV\n`);

  // Get Nigeria country
  const nigeria = await prisma.country.findUnique({
    where: { code: 'NG' },
  });

  if (!nigeria) {
    console.error('Nigeria not found in database. Please run main seed first.');
    return;
  }

  // Get all states
  const states = await prisma.state.findMany({
    where: { countryId: nigeria.id },
  });
  const statesByName = new Map(
    states.map(s => [s.name.toUpperCase(), s])
  );

  console.log(`Found ${states.length} states in database\n`);

  // ============================================
  // 1. CREATE GEOPOLITICAL ZONES
  // ============================================
  console.log('Creating geopolitical zones...');

  const uniqueGeoZones = new Map<number, { name: string; id: number }>();
  for (const m of mappings) {
    if (m.geopoliticalZoneId && m.geopoliticalZone && !uniqueGeoZones.has(m.geopoliticalZoneId)) {
      uniqueGeoZones.set(m.geopoliticalZoneId, {
        name: m.geopoliticalZone,
        id: m.geopoliticalZoneId,
      });
    }
  }

  const geoZoneMap = new Map<number, string>(); // oldId -> newUUID

  for (const [oldId, zone] of uniqueGeoZones) {
    const code = generateCode(zone.name);
    const geoZone = await prisma.geopoliticalZone.upsert({
      where: { countryId_code: { countryId: nigeria.id, code } },
      update: { name: zone.name },
      create: {
        countryId: nigeria.id,
        name: zone.name,
        code,
      },
    });
    geoZoneMap.set(oldId, geoZone.id);
  }
  console.log(`✓ Created ${geoZoneMap.size} geopolitical zones\n`);

  // ============================================
  // 2. UPDATE STATES WITH GEOPOLITICAL ZONES
  // ============================================
  console.log('Updating states with geopolitical zones...');

  // Build state -> geopolitical zone mapping
  const stateGeoZoneMap = new Map<string, string>(); // stateName -> geoZoneId
  for (const m of mappings) {
    const stateNameUpper = m.stateName.toUpperCase();
    if (!stateGeoZoneMap.has(stateNameUpper) && m.geopoliticalZoneId) {
      const geoZoneId = geoZoneMap.get(m.geopoliticalZoneId);
      if (geoZoneId) {
        stateGeoZoneMap.set(stateNameUpper, geoZoneId);
      }
    }
  }

  let statesUpdated = 0;
  for (const [stateName, geoZoneId] of stateGeoZoneMap) {
    const state = statesByName.get(stateName);
    if (state) {
      await prisma.state.update({
        where: { id: state.id },
        data: { geopoliticalZoneId: geoZoneId },
      });
      statesUpdated++;
    }
  }
  console.log(`✓ Updated ${statesUpdated} states with geopolitical zones\n`);

  // ============================================
  // 3. CREATE SENATORIAL ZONES (by state)
  // ============================================
  console.log('Creating senatorial zones...');

  // Group senatorial zones by state
  const senatorialByState = new Map<string, Map<number, { name: string; id: number }>>();
  for (const m of mappings) {
    const stateNameUpper = m.stateName.toUpperCase();
    if (!senatorialByState.has(stateNameUpper)) {
      senatorialByState.set(stateNameUpper, new Map());
    }
    const stateZones = senatorialByState.get(stateNameUpper)!;
    if (m.senatorialZoneId && m.senatorialZone && !stateZones.has(m.senatorialZoneId)) {
      stateZones.set(m.senatorialZoneId, {
        name: m.senatorialZone,
        id: m.senatorialZoneId,
      });
    }
  }

  const senatorialZoneMap = new Map<number, string>(); // oldId -> newUUID
  let senatorialCount = 0;

  for (const [stateName, zones] of senatorialByState) {
    const state = statesByName.get(stateName);
    if (!state) continue;

    for (const [oldId, zone] of zones) {
      const code = generateCode(zone.name);
      try {
        const senatorialZone = await prisma.senatorialZone.upsert({
          where: { stateId_code: { stateId: state.id, code } },
          update: { name: zone.name },
          create: {
            stateId: state.id,
            name: zone.name,
            code,
          },
        });
        senatorialZoneMap.set(oldId, senatorialZone.id);
        senatorialCount++;
      } catch (error) {
        console.error(`  Error creating senatorial zone ${zone.name}:`, error.message);
      }
    }
  }
  console.log(`✓ Created ${senatorialCount} senatorial zones\n`);

  // ============================================
  // 4. CREATE FEDERAL CONSTITUENCIES (by state)
  // ============================================
  console.log('Creating federal constituencies...');

  // Group federal constituencies by state
  const fedConstByState = new Map<string, Map<number, { name: string; id: number }>>();
  for (const m of mappings) {
    const stateNameUpper = m.stateName.toUpperCase();
    if (!fedConstByState.has(stateNameUpper)) {
      fedConstByState.set(stateNameUpper, new Map());
    }
    const stateConsts = fedConstByState.get(stateNameUpper)!;
    if (m.federalConstituencyId && m.federalConstituency && !stateConsts.has(m.federalConstituencyId)) {
      stateConsts.set(m.federalConstituencyId, {
        name: m.federalConstituency,
        id: m.federalConstituencyId,
      });
    }
  }

  const fedConstMap = new Map<number, string>(); // oldId -> newUUID
  let fedConstCount = 0;

  for (const [stateName, constituencies] of fedConstByState) {
    const state = statesByName.get(stateName);
    if (!state) continue;

    for (const [oldId, constituency] of constituencies) {
      const code = generateCode(constituency.name);
      try {
        const fedConst = await prisma.federalConstituency.upsert({
          where: { stateId_code: { stateId: state.id, code } },
          update: { name: constituency.name },
          create: {
            stateId: state.id,
            name: constituency.name,
            code,
          },
        });
        fedConstMap.set(oldId, fedConst.id);
        fedConstCount++;
      } catch (error) {
        console.error(`  Error creating federal constituency ${constituency.name}:`, error.message);
      }
    }
  }
  console.log(`✓ Created ${fedConstCount} federal constituencies\n`);

  // ============================================
  // 5. UPDATE LGAs WITH ZONE MAPPINGS
  // ============================================
  console.log('Updating LGAs with zone mappings...');

  // Get all LGAs with their states
  const lgas = await prisma.lGA.findMany({
    include: { state: true },
  });

  // Group LGAs by state for efficient lookup
  const lgasByState = new Map<string, Array<{ id: string; name: string; stateId: string }>>();
  for (const lga of lgas) {
    const stateNameUpper = lga.state.name.toUpperCase();
    if (!lgasByState.has(stateNameUpper)) {
      lgasByState.set(stateNameUpper, []);
    }
    lgasByState.get(stateNameUpper)!.push({
      id: lga.id,
      name: lga.name,
      stateId: lga.stateId,
    });
  }

  let lgasUpdated = 0;
  let lgasNotFound = 0;
  const notFoundList: string[] = [];

  for (const m of mappings) {
    const stateNameUpper = m.stateName.toUpperCase();
    const lgasInState = lgasByState.get(stateNameUpper) || [];

    // Use fuzzy matching to find the best match
    const matchedLga = findBestMatch(m.lgaName, m.stateName, lgasInState);

    if (matchedLga) {
      const geoZoneId = m.geopoliticalZoneId ? geoZoneMap.get(m.geopoliticalZoneId) : null;
      const senatorialZoneId = m.senatorialZoneId ? senatorialZoneMap.get(m.senatorialZoneId) : null;
      const fedConstId = m.federalConstituencyId ? fedConstMap.get(m.federalConstituencyId) : null;

      try {
        await prisma.lGA.update({
          where: { id: matchedLga.id },
          data: {
            geopoliticalZoneId: geoZoneId || undefined,
            senatorialZoneId: senatorialZoneId || undefined,
            federalConstituencyId: fedConstId || undefined,
          },
        });
        lgasUpdated++;

        if (lgasUpdated % 100 === 0) {
          console.log(`  Updated ${lgasUpdated} LGAs...`);
        }
      } catch (error) {
        console.error(`  Error updating LGA ${m.lgaName}:`, error.message);
      }
    } else {
      lgasNotFound++;
      notFoundList.push(`${m.lgaName} (${m.stateName})`);
    }
  }

  // Show all unmatched LGAs for debugging
  if (notFoundList.length > 0) {
    console.log(`\n  Unmatched LGAs (${notFoundList.length}):`);
    for (const item of notFoundList.slice(0, 20)) {
      console.log(`    - ${item}`);
    }
    if (notFoundList.length > 20) {
      console.log(`    ... and ${notFoundList.length - 20} more`);
    }
  }

  console.log(`\n✓ Updated ${lgasUpdated} LGAs with zone mappings`);
  console.log(`  ${lgasNotFound} LGAs from CSV not found in database\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('========================================');
  console.log('LOCATION MAPPING COMPLETED!');
  console.log('========================================');
  console.log(`✓ Geopolitical Zones: ${geoZoneMap.size}`);
  console.log(`✓ Senatorial Zones: ${senatorialCount}`);
  console.log(`✓ Federal Constituencies: ${fedConstCount}`);
  console.log(`✓ LGAs Updated: ${lgasUpdated}`);
  console.log('========================================\n');
}

// Allow running this seeder independently
if (require.main === module) {
  console.log('Starting location mapping seed...\n');

  seedLocationMapping()
    .catch((e) => {
      console.error('\n Error during location mapping seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
