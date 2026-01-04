-- Add username and profession to users table
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "profession" TEXT;

-- Add unique constraint and index for username
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
CREATE INDEX "users_username_idx" ON "users"("username");

-- Add locationLevel to posts table
ALTER TABLE "posts" ADD COLUMN "locationLevel" TEXT;

-- Create platform_settings table
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "publicOrgEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default platform settings
INSERT INTO "platform_settings" ("id", "publicOrgEnabled", "updatedAt")
VALUES ('default', true, NOW())
ON CONFLICT ("id") DO NOTHING;
