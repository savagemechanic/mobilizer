-- AlterTable: Add authProvider to users and make password nullable for social login
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authProvider" TEXT DEFAULT 'email';
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: Add new columns to device_tokens
ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "device_tokens" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

-- Drop old unique index if exists (may fail if doesn't exist, that's ok)
DROP INDEX IF EXISTS "device_tokens_userId_token_key";

-- CreateIndex: unique index on token
CREATE UNIQUE INDEX IF NOT EXISTS "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex: index on token for faster lookups
CREATE INDEX IF NOT EXISTS "device_tokens_token_idx" ON "device_tokens"("token");
