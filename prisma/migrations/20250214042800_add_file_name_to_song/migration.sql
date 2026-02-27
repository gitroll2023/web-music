/*
  Warnings:

  - Added the required column `fileName` to the `songs` table without a default value. This is not possible if the table is not empty.

*/
-- 기존 데이터에 대한 fileName 설정
-- AlterTable
ALTER TABLE "songs" ADD COLUMN "fileName" TEXT;
UPDATE "songs" SET "fileName" = title;
ALTER TABLE "songs" ALTER COLUMN "fileName" SET NOT NULL;
