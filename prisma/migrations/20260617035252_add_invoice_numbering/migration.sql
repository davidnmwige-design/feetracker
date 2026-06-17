-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceNumber" INTEGER;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1000;
