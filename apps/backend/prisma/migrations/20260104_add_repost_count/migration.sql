-- AlterTable: Add repostCount column to posts table
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "repostCount" INTEGER NOT NULL DEFAULT 0;
