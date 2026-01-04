-- AlterTable
ALTER TABLE "posts" ADD COLUMN "countryId" TEXT;

-- CreateIndex
CREATE INDEX "posts_countryId_idx" ON "posts"("countryId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
