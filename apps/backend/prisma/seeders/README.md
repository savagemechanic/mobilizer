# Database Seeders

This directory contains database seeding scripts for the Mobilizer v2 backend.

## Overview

The seeding system consists of:

1. **Main Seed** (`prisma/seed.ts`) - Seeds all data including sample users, movements, and organizations
2. **Location Seeders** - Seeds Nigerian geographic data (states, LGAs, wards, polling units)

## Location Data

### Source File

Location data is sourced from `location_lookups.sql` in the project root, which contains:

- **37 States** - All Nigerian states including FCT
- **774 LGAs** - All Local Government Areas
- **~8,800 Wards** - Registration areas (electoral wards)
- **~120,000+ Polling Units** - Individual voting locations

### Seeding Options

#### Option 1: Full Seed with Locations

Seed everything including all Nigerian locations (takes 10-15 minutes):

```bash
# From apps/backend directory
yarn seed --full-locations

# Or with environment variable
SEED_FULL_LOCATIONS=true yarn seed
```

#### Option 2: Sample Data Only (Default)

Seed sample data with limited locations (fast, ~1 minute):

```bash
# From apps/backend directory
yarn seed
```

This creates:
- 10 sample states
- 8 LGAs for Lagos
- 4 wards for Ikeja
- 4 polling units for Alausa Ward
- Test users, movements, and organizations

#### Option 3: Locations Only

Seed ONLY the location data without users or movements:

```bash
# From apps/backend directory
yarn seed:locations

# Or directly
npx ts-node prisma/seeders/seed-locations-only.ts
```

## Location Seeder Files

### `locations-batch.ts`

**Main location seeder** - Recommended for most use cases.

- Reads the entire SQL file into memory (27MB)
- Fast regex-based parsing
- Batch inserts for polling units
- Estimated time: 10-15 minutes

### `locations.ts`

**Streaming location seeder** - Alternative approach.

- Streams the SQL file line-by-line (memory efficient)
- Slower but uses less memory
- Good for resource-constrained environments

### `seed-locations-only.ts`

**Standalone script** - Seeds only locations, nothing else.

- Uses `locations-batch.ts` internally
- Includes progress messages and countdown
- Run with `yarn seed:locations`

## Implementation Details

### Data Hierarchy

```
Country (Nigeria)
  └─ State (37 states)
      └─ LGA (774 total)
          └─ Ward (~8,800 total)
              └─ Polling Unit (~120,000+ total)
```

### Database Schema

All location models use UUID primary keys and unique constraints:

```prisma
model State {
  id        String   @id @default(uuid())
  countryId String
  name      String
  code      String   // Maps to SQL abbreviation field

  @@unique([countryId, code])
}

model LGA {
  id      String @id @default(uuid())
  stateId String
  name    String
  code    String

  @@unique([stateId, code])
}

model Ward {
  id    String @id @default(uuid())
  lgaId String
  name  String
  code  String

  @@unique([lgaId, code])
}

model PollingUnit {
  id     String @id @default(uuid())
  wardId String
  name   String
  code   String

  @@unique([wardId, code])
}
```

### SQL Parsing Strategy

The seeder extracts data from SQL INSERT statements:

1. **Extract table blocks** - Finds INSERT statements for each table
2. **Parse value tuples** - Regex matches `(value1, value2, ...)`
3. **Map old IDs to new UUIDs** - Maintains relationship integrity
4. **Upsert with unique constraints** - Prevents duplicates on re-runs

### Performance Considerations

**Full location seeding:**
- ~120,000 database operations
- Upserts use unique constraints (idempotent)
- Polling units seeded in batches of 500
- Expected duration: 10-15 minutes

**Memory usage:**
- `locations-batch.ts`: ~200MB (reads entire file)
- `locations.ts`: ~50MB (streams file)

## Adding to package.json

Add these scripts to `apps/backend/package.json`:

```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts",
    "seed:full": "SEED_FULL_LOCATIONS=true ts-node prisma/seed.ts",
    "seed:locations": "ts-node prisma/seeders/seed-locations-only.ts"
  }
}
```

## Troubleshooting

### "SQL file not found"

Ensure `location_lookups.sql` exists in the project root:

```bash
ls -lh /path/to/mobilizerv2/location_lookups.sql
```

### Duplicate key errors

The seeder uses `upsert` so it's safe to re-run. Duplicate errors are silently handled.

### Out of memory

If you encounter memory issues:
- Use `locations.ts` instead of `locations-batch.ts`
- Or seed in smaller batches by modifying `BATCH_SIZE`

### Slow performance

- Ensure database connection is stable
- Check PostgreSQL settings (`max_connections`, `shared_buffers`)
- Consider running seeder on same network as database

## Verifying Seeded Data

Check counts after seeding:

```sql
SELECT COUNT(*) FROM states;        -- Should be 37
SELECT COUNT(*) FROM lgas;          -- Should be 774
SELECT COUNT(*) FROM wards;         -- Should be ~8,800
SELECT COUNT(*) FROM polling_units; -- Should be ~120,000
```

Or using Prisma:

```typescript
const stateCo = await prisma.state.count();
const lgaCount = await prisma.lGA.count();
const wardCount = await prisma.ward.count();
const puCount = await prisma.pollingUnit.count();

console.log({ stateCount, lgaCount, wardCount, puCount });
```

## Notes

- Location codes from SQL are stored in the `code` field
- SQL `abbreviation` field maps to Prisma `code` field
- SQL `delimitation` field (for polling units) is NOT stored (can be derived)
- All location IDs are UUIDs, not integers from SQL
- Relationships maintained through foreign keys

## Future Enhancements

- [ ] Add progress bars for long-running seeds
- [ ] Implement parallel batch inserts
- [ ] Add data validation before insert
- [ ] Create rollback script
- [ ] Add geolocation coordinates
