-- CreateTable
CREATE TABLE "StkRequest" (
    "id" SERIAL NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "merchantRequestId" TEXT,
    "schoolId" INTEGER NOT NULL,
    "studentId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mpesaReceipt" TEXT,
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StkRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StkRequest_checkoutRequestId_key" ON "StkRequest"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "StkRequest_schoolId_idx" ON "StkRequest"("schoolId");

-- CreateIndex
CREATE INDEX "StkRequest_studentId_idx" ON "StkRequest"("studentId");

-- CreateIndex
CREATE INDEX "StkRequest_status_idx" ON "StkRequest"("status");
