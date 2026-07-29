/*
  Warnings:

  - The values [GENERAL,VILLA,APARTMENT,ACTIVITY,TRANSPORTATION,SPA,RESTAURANT,RESERVATION] on the enum `RequestType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "ContactRequesterStage" ADD VALUE 'INDIVIDUAL';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestType_new" AS ENUM ('ADVISOR_GUIDE', 'COMPLAINT', 'SUPPORT', 'PARTNERSHIP', 'OTHER');
ALTER TABLE "ContactRequest" ALTER COLUMN "requestType" TYPE "RequestType_new" USING ("requestType"::text::"RequestType_new");
ALTER TYPE "RequestType" RENAME TO "RequestType_old";
ALTER TYPE "RequestType_new" RENAME TO "RequestType";
DROP TYPE "public"."RequestType_old";
COMMIT;
