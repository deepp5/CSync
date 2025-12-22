/*
  Warnings:

  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
