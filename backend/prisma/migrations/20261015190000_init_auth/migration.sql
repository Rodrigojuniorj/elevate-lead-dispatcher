CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR');

CREATE TABLE "call_centers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_centers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "call_center_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_operator_requires_call_center" CHECK ("role" <> 'OPERATOR' OR "call_center_id" IS NOT NULL),
    CONSTRAINT "users_admin_has_no_call_center" CHECK ("role" <> 'ADMIN' OR "call_center_id" IS NULL)
);

CREATE UNIQUE INDEX "call_centers_name_key" ON "call_centers"("name");
CREATE UNIQUE INDEX "call_centers_code_key" ON "call_centers"("code");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_call_center_id_idx" ON "users"("call_center_id");

ALTER TABLE "users" ADD CONSTRAINT "users_call_center_id_fkey"
  FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
