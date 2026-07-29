ALTER TABLE "RecordFlow"
ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "RecordFlowVersion" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceEntity" TEXT NOT NULL,
    "trigger" "FlowTrigger" NOT NULL,
    "condition" JSONB,
    "actions" JSONB NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordFlowVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecordFlowVersion_flowId_version_key"
ON "RecordFlowVersion"("flowId", "version");

CREATE INDEX "RecordFlowVersion_flowId_createdDate_idx"
ON "RecordFlowVersion"("flowId", "createdDate");

ALTER TABLE "RecordFlowVersion"
ADD CONSTRAINT "RecordFlowVersion_flowId_fkey"
FOREIGN KEY ("flowId") REFERENCES "RecordFlow"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "RecordFlowVersion" (
    "id", "flowId", "version", "name", "description",
    "sourceEntity", "trigger", "condition", "actions", "createdDate"
)
SELECT
    'flow-version-' || "id", "id", 1, "name", "description",
    "sourceEntity", "trigger", "condition", "actions", "updatedDate"
FROM "RecordFlow";
