/*
  Warnings:

  - You are about to drop the column `file_url` on the `songs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "songs" DROP COLUMN "file_url",
ADD COLUMN     "stream_url" TEXT;
