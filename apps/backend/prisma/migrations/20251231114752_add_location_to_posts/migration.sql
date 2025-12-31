-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "lgaId" TEXT,
ADD COLUMN     "pollingUnitId" TEXT,
ADD COLUMN     "stateId" TEXT,
ADD COLUMN     "wardId" TEXT;

-- CreateIndex
CREATE INDEX "posts_stateId_idx" ON "posts"("stateId");

-- CreateIndex
CREATE INDEX "posts_lgaId_idx" ON "posts"("lgaId");

-- CreateIndex
CREATE INDEX "posts_wardId_idx" ON "posts"("wardId");

-- CreateIndex
CREATE INDEX "posts_pollingUnitId_idx" ON "posts"("pollingUnitId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "lgas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_pollingUnitId_fkey" FOREIGN KEY ("pollingUnitId") REFERENCES "polling_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
