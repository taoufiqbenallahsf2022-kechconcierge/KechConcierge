/*
  Warnings:

  - Added the required column `Wifi` to the `Villa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bedrooms` to the `Villa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Villa" ADD COLUMN     "Wifi" BOOLEAN NOT NULL,
ADD COLUMN     "bedrooms" INTEGER NOT NULL;
