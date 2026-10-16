CREATE TYPE "DistributionJobStatus" AS ENUM ('PENDING', 'ENQUEUED', 'COMPLETED');
CREATE TYPE "DistributionStrategy" AS ENUM ('SMOOTH_WEIGHTED_ROUND_ROBIN');

CREATE TABLE "call_center_dispatch_configs" (
    "id" UUID NOT NULL,
    "call_center_id" UUID NOT NULL,
    "weight" INTEGER NOT NULL,
    "current_weight" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_center_dispatch_configs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "call_center_dispatch_configs_weight_check" CHECK ("weight" > 0)
);

CREATE TABLE "distribution_jobs" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "status" "DistributionJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "distributions" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "call_center_id" UUID NOT NULL,
    "strategy" "DistributionStrategy" NOT NULL,
    "applied_weight" INTEGER NOT NULL,
    "total_weight" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "distributions_applied_weight_check" CHECK ("applied_weight" > 0),
    CONSTRAINT "distributions_total_weight_check" CHECK ("total_weight" > 0)
);

CREATE UNIQUE INDEX "call_center_dispatch_configs_call_center_id_key" ON "call_center_dispatch_configs"("call_center_id");
CREATE INDEX "call_center_dispatch_configs_is_enabled_idx" ON "call_center_dispatch_configs"("is_enabled");
CREATE UNIQUE INDEX "distribution_jobs_lead_id_key" ON "distribution_jobs"("lead_id");
CREATE INDEX "distribution_jobs_status_published_at_idx" ON "distribution_jobs"("status", "published_at");
CREATE UNIQUE INDEX "distributions_lead_id_key" ON "distributions"("lead_id");
CREATE INDEX "distributions_call_center_id_assigned_at_idx" ON "distributions"("call_center_id", "assigned_at");

ALTER TABLE "call_center_dispatch_configs" ADD CONSTRAINT "call_center_dispatch_configs_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distribution_jobs" ADD CONSTRAINT "distribution_jobs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
