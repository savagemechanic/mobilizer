# Location Data Seeding Guide

This guide explains how to seed Nigerian location data (states, LGAs, wards, and polling units) into the Mobilizer v2 database.

## Quick Start

### Option 1: Seed Everything (Sample Locations + Test Data)

```bash
cd apps/backend
yarn prisma:seed
```

This creates sample location data (10 states, 8 LGAs, 4 wards, 4 polling units) plus test users and movements. **Fast: ~1 minute**

### Option 2: Seed Everything (Full Locations + Test Data)

```bash
cd apps/backend
yarn prisma:seed:full
```

This creates ALL Nigerian locations (37 states, 774 LGAs, ~8,800 wards, ~120,000 polling units) plus test users and movements. **Slow: ~10-15 minutes**

### Option 3: Seed Locations Only

```bash
cd apps/backend
yarn prisma:seed:locations
```

This creates ONLY location data, no test users or movements. **Slow: ~10-15 minutes**

## What Gets Seeded

### Full Location Data

When you use `--full-locations` or `seed:locations`:

- **37 States** - All Nigerian states including FCT
- **774 LGAs** - All Local Government Areas
- **~8,800 Wards** - All electoral registration areas
- **~120,000+ Polling Units** - All voting locations

### Sample Location Data (Default)

When you run the regular seed:

- **10 States** - Lagos, FCT, Kano, Rivers, Oyo, Kaduna, Delta, Enugu, Anambra, Ogun
- **8 LGAs** - Lagos LGAs only (Ikeja, Lagos Island, Victoria Island, Surulere, Lekki, Ikoyi, Yaba, Mushin)
- **4 Wards** - Ikeja wards only (Alausa, GRA, Oregun, Opebi)
- **4 Polling Units** - Alausa polling units only

Plus:
- Test users (platform admin, super admin, regular users)
- Sample movements
- Sample organizations
- Sample posts and events

## Data Source

Location data is parsed from `location_lookups.sql` in the project root directory. This SQL file contains INSERT statements for all Nigerian electoral locations.

**File size:** ~27MB
**Format:** MySQL dump with INSERT statements

## Database Schema

Locations follow a hierarchical structure:

```
Country (Nigeria)
  └─ State (code: 2-char abbreviation)
      └─ LGA (code: 2-char abbreviation)
          └─ Ward (code: 2-4 char abbreviation)
              └─ Polling Unit (code: unique identifier)
```

All location models use:
- **UUID primary keys** (not integer IDs from SQL)
- **Unique constraints** on `(parentId, code)` to prevent duplicates
- **Cascading deletes** to maintain referential integrity

## Commands Reference

| Command | Description | Duration |
|---------|-------------|----------|
| `yarn prisma:seed` | Sample locations + test data | ~1 min |
| `yarn prisma:seed:full` | Full locations + test data | ~10-15 min |
| `yarn prisma:seed:locations` | Full locations only | ~10-15 min |
| `yarn prisma migrate reset` | Reset DB + run seed | Varies |

## Environment Variables

You can also control seeding with environment variables:

```bash
# Seed with full locations
SEED_FULL_LOCATIONS=true yarn prisma:seed

# Or use the shortcut
yarn prisma:seed:full
```

## Performance Notes

- **Polling units** are the bottleneck (~120,000 records)
- Inserts are batched in groups of 500 for performance
- Uses `upsert` so it's safe to re-run (idempotent)
- Database indexes on `(parentId, code)` speed up lookups

## Verifying Seeded Data

Check counts in Prisma Studio:

```bash
yarn prisma:studio
```

Or query directly:

```sql
SELECT COUNT(*) FROM states;          -- Should be 37
SELECT COUNT(*) FROM lgas;            -- Should be 774
SELECT COUNT(*) FROM wards;           -- Should be ~8,800
SELECT COUNT(*) FROM polling_units;   -- Should be ~120,000
```

## Troubleshooting

### "SQL file not found"

Make sure `location_lookups.sql` exists in the project root:

```bash
ls -lh location_lookups.sql
```

If missing, contact your team lead for the file.

### Duplicate key errors

The seeder uses `upsert` to handle duplicates gracefully. Safe to re-run.

### Out of memory

If you get memory errors during full location seeding:

1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" yarn prisma:seed:full
   ```

2. Or use the streaming seeder (edit `seed.ts` to import from `locations.ts` instead of `locations-batch.ts`)

### Slow performance

- Ensure PostgreSQL is running locally or on fast network
- Check database connection settings in `.env`
- Consider running seeder during off-peak hours

## Implementation Details

See `apps/backend/prisma/seeders/README.md` for technical details about:

- SQL parsing strategy
- Batch insert optimization
- Memory usage
- Code structure

## Next Steps

After seeding:

1. **Verify data**: Open Prisma Studio and check location tables
2. **Test queries**: Try fetching states, LGAs, wards in your GraphQL playground
3. **Create organizations**: Link organizations to specific locations
4. **Assign users**: Set user locations (state, LGA, ward, polling unit)

## Support

For issues or questions about location seeding:

1. Check `apps/backend/prisma/seeders/README.md`
2. Review seeder logs for error messages
3. Contact the backend team
