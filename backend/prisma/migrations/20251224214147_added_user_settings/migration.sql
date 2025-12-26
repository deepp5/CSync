-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('FOLLOWERS', 'PRIVATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'FOLLOWERS',
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false;
