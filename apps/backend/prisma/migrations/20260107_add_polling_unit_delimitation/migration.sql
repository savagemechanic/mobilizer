-- AlterTable: Add delimitation column to polling_units
ALTER TABLE "polling_units" ADD COLUMN "delimitation" TEXT;

-- CreateIndex: Unique constraint on delimitation
CREATE UNIQUE INDEX "polling_units_delimitation_key" ON "polling_units"("delimitation");

-- CreateIndex: Index for faster lookups by delimitation
CREATE INDEX "polling_units_delimitation_idx" ON "polling_units"("delimitation");
