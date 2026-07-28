CREATE TYPE "FlowRunStatus" AS ENUM (
    'RUNNING',
    'COMPLETED',
    'COMPLETED_WITH_ERRORS',
    'FAILED'
);

CREATE TYPE "FlowActivityRunStatus" AS ENUM ('COMPLETED', 'FAILED');

CREATE TABLE "RecordFlowRun" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "flowVersionId" TEXT,
    "triggerRecordId" TEXT,
    "status" "FlowRunStatus" NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "startedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),

    CONSTRAINT "RecordFlowRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecordFlowActivityRun" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "status" "FlowActivityRunStatus" NOT NULL,
    "inputCount" INTEGER NOT NULL DEFAULT 0,
    "outputCount" INTEGER NOT NULL DEFAULT 0,
    "affectedCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "error" TEXT,
    "startedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),

    CONSTRAINT "RecordFlowActivityRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecordFlowRun_flowId_startedDate_idx"
ON "RecordFlowRun"("flowId", "startedDate");

CREATE INDEX "RecordFlowRun_flowVersionId_idx"
ON "RecordFlowRun"("flowVersionId");

CREATE INDEX "RecordFlowActivityRun_runId_activityId_idx"
ON "RecordFlowActivityRun"("runId", "activityId");

ALTER TABLE "RecordFlowRun"
ADD CONSTRAINT "RecordFlowRun_flowId_fkey"
FOREIGN KEY ("flowId") REFERENCES "RecordFlow"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecordFlowRun"
ADD CONSTRAINT "RecordFlowRun_flowVersionId_fkey"
FOREIGN KEY ("flowVersionId") REFERENCES "RecordFlowVersion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecordFlowActivityRun"
ADD CONSTRAINT "RecordFlowActivityRun_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "RecordFlowRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
