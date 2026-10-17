DROP INDEX "leads_created_at_idx";
DROP INDEX "leads_status_created_at_idx";
DROP INDEX "leads_funnel_product_id_idx";
DROP INDEX "leads_source_idx";

CREATE INDEX "leads_created_at_id_idx" ON "leads"("created_at", "id");
CREATE INDEX "leads_status_created_at_id_idx" ON "leads"("status", "created_at", "id");
CREATE INDEX "leads_funnel_product_id_created_at_id_idx" ON "leads"("funnel_product_id", "created_at", "id");
CREATE INDEX "leads_source_created_at_id_idx" ON "leads"("source", "created_at", "id");
CREATE INDEX "distributions_call_center_id_lead_id_idx" ON "distributions"("call_center_id", "lead_id");
