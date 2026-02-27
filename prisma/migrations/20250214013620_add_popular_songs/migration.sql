/*
  Warnings:

  - You are about to drop the column `is_popular` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `timestamps` on the `songs` table. All the data in the column will be lost.
  - Made the column `chapter_id` on table `songs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `genre_id` on table `songs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_genre_id_fkey";

-- DropIndex
DROP INDEX "songs_chapter_id_idx";

-- DropIndex
DROP INDEX "songs_created_at_idx";

-- DropIndex
DROP INDEX "songs_genre_id_idx";

-- DropIndex
DROP INDEX "songs_is_popular_idx";

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "is_popular",
DROP COLUMN "timestamps",
ALTER COLUMN "chapter_id" SET NOT NULL,
ALTER COLUMN "genre_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "popular_songs" (
    "id" SERIAL NOT NULL,
    "song_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "popular_songs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "popular_songs_song_id_key" ON "popular_songs"("song_id");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popular_songs" ADD CONSTRAINT "popular_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
