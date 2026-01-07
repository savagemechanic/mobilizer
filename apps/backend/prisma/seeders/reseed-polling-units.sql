-- Reseed Polling Units with Delimitation Codes
-- Run this directly with psql for better performance:
-- psql $DATABASE_URL -f prisma/seeders/reseed-polling-units.sql

BEGIN;

-- 1. Clear all foreign key references to polling units
UPDATE users SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL;
UPDATE organizations SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL;
UPDATE posts SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL;
UPDATE events SET "pollingUnitId" = NULL WHERE "pollingUnitId" IS NOT NULL;
UPDATE org_memberships SET "leaderPollingUnitId" = NULL WHERE "leaderPollingUnitId" IS NOT NULL;

-- 2. Delete all existing polling units
DELETE FROM polling_units;

COMMIT;

-- After running this, run the TypeScript seeder to insert new polling units:
-- npx ts-node prisma/seeders/reseed-polling-units-insert-only.ts
