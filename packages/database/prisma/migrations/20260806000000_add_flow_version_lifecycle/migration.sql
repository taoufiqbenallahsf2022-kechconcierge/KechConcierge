CREATE TYPE "FlowVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

ALTER TABLE "RecordFlowVersion"
ADD COLUMN "status" "FlowVersionStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "updatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "RecordFlowVersion" AS version
SET "status" = CASE
    WHEN flow."isActive" AND version."version" = flow."currentVersion"
        THEN 'ACTIVE'::"FlowVersionStatus"
    ELSE 'DRAFT'::"FlowVersionStatus"
END
FROM "RecordFlow" AS flow
WHERE version."flowId" = flow."id";
