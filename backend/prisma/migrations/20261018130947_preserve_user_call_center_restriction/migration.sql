-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_call_center_id_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_call_center_id_fkey" FOREIGN KEY ("call_center_id") REFERENCES "call_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
