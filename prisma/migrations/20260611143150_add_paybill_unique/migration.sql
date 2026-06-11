-- DropIndex
DROP INDEX "School_paybill_idx";

-- CreateIndex
CREATE UNIQUE INDEX "School_paybill_key" ON "School"("paybill");

