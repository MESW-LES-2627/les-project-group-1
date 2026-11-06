-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'CLUB', 'BUYER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'BUYER';
