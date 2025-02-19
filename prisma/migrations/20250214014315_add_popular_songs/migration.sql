/*
  Warnings:

  - You are about to drop the column `image_id` on the `chapters` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `chapters` table. All the data in the column will be lost.
  - You are about to drop the column `order_num` on the `chapters` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `genres` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "chapters_name_idx";

-- DropIndex
DROP INDEX "genres_name_idx";

-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "image_id",
DROP COLUMN "image_url",
DROP COLUMN "order_num";

-- CreateIndex
CREATE UNIQUE INDEX "chapters_name_key" ON "chapters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");
