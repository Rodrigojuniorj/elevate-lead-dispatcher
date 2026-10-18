-- CreateTable
CREATE TABLE "call_center_webhook_credentials" (
    "id" UUID NOT NULL,
    "call_center_id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "call_center_webhook_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_center_webhook_credentials_key_hash_key" ON "call_center_webhook_credentials"("key_hash");

-- CreateIndex
CREATE INDEX "call_center_webhook_credentials_call_center_id_is_active_idx" ON "call_center_webhook_credentials"("call_center_id", "is_active");

-- AddForeignKey
ALTER TABLE "call_center_webhook_credentials" ADD CONSTRAINT "call_center_webhook_credentials_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
