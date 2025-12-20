/*
  Warnings:

  - You are about to drop the column `lookingFor` on the `Post` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "lookingFor",
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL;
