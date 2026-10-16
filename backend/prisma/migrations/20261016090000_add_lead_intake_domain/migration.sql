CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'NO_ANSWER', 'CALLBACK', 'QUALIFIED', 'SALE', 'REFUND', 'INVALID');
CREATE TYPE "LeadStatusEventSource" AS ENUM ('SYSTEM', 'WEBHOOK', 'MANUAL');

CREATE TABLE "funnels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "funnel_products" (
    "id" UUID NOT NULL,
    "funnel_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "affiliates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "funnel_product_id" UUID NOT NULL,
    "affiliate_id" UUID,
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_status_history" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "status" "LeadStatus" NOT NULL,
    "event_source" "LeadStatusEventSource" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "funnels_code_key" ON "funnels"("code");
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE UNIQUE INDEX "funnel_products_funnel_id_product_id_key" ON "funnel_products"("funnel_id", "product_id");
CREATE INDEX "funnel_products_product_id_idx" ON "funnel_products"("product_id");
CREATE UNIQUE INDEX "affiliates_code_key" ON "affiliates"("code");
CREATE UNIQUE INDEX "leads_idempotency_key_key" ON "leads"("idempotency_key");
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
CREATE INDEX "leads_status_created_at_idx" ON "leads"("status", "created_at");
CREATE INDEX "leads_funnel_product_id_idx" ON "leads"("funnel_product_id");
CREATE INDEX "leads_affiliate_id_idx" ON "leads"("affiliate_id");
CREATE INDEX "leads_source_idx" ON "leads"("source");
CREATE INDEX "lead_status_history_lead_id_occurred_at_idx" ON "lead_status_history"("lead_id", "occurred_at");

ALTER TABLE "funnel_products" ADD CONSTRAINT "funnel_products_funnel_id_fkey"
  FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "funnel_products" ADD CONSTRAINT "funnel_products_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_funnel_product_id_fkey"
  FOREIGN KEY ("funnel_product_id") REFERENCES "funnel_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_affiliate_id_fkey"
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
