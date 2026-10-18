-- CreateEnum
CREATE TYPE "CallCenterWebhookEventOutcome" AS ENUM ('APPLIED', 'IGNORED_STALE', 'IGNORED_UNCHANGED', 'REJECTED_INVALID_TRANSITION');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_call_center_id_fkey";

-- CreateTable
CREATE TABLE "call_center_webhook_events" (
    "id" UUID NOT NULL,
    "call_center_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL,
    "resulting_status" "LeadStatus" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "outcome" "CallCenterWebhookEventOutcome" NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_center_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_center_webhook_events_lead_id_occurred_at_idx" ON "call_center_webhook_events"("lead_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "call_center_webhook_events_call_center_id_external_id_key" ON "call_center_webhook_events"("call_center_id", "external_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_center_webhook_events" ADD CONSTRAINT "call_center_webhook_events_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_center_webhook_events" ADD CONSTRAINT "call_center_webhook_events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
