-- CreateEnum
CREATE TYPE "LeaderLevel" AS ENUM ('STATE', 'LGA', 'WARD', 'POLLING_UNIT');

-- AlterTable
ALTER TABLE "org_memberships" ADD COLUMN     "isLeader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leaderAssignedAt" TIMESTAMP(3),
ADD COLUMN     "leaderAssignedBy" TEXT,
ADD COLUMN     "leaderLevel" "LeaderLevel",
ADD COLUMN     "leaderLgaId" TEXT,
ADD COLUMN     "leaderPollingUnitId" TEXT,
ADD COLUMN     "leaderStateId" TEXT,
ADD COLUMN     "leaderWardId" TEXT;

-- CreateIndex
CREATE INDEX "org_memberships_isLeader_idx" ON "org_memberships"("isLeader");

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_leaderStateId_fkey" FOREIGN KEY ("leaderStateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_leaderLgaId_fkey" FOREIGN KEY ("leaderLgaId") REFERENCES "lgas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_leaderWardId_fkey" FOREIGN KEY ("leaderWardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_memberships" ADD CONSTRAINT "org_memberships_leaderPollingUnitId_fkey" FOREIGN KEY ("leaderPollingUnitId") REFERENCES "polling_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
