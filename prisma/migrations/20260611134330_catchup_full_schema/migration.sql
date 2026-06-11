-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "schoolId" INTEGER,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload';

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "accountNumberFormat" TEXT,
ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "brandColor" TEXT DEFAULT '#c8a84b',
ADD COLUMN     "currentPlan" TEXT NOT NULL DEFAULT 'Starter',
ADD COLUMN     "emailSignature" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "penaltyDueDate" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "penaltyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "penaltyType" TEXT NOT NULL DEFAULT 'fixed',
ADD COLUMN     "replyToEmail" TEXT,
ADD COLUMN     "schoolMotto" TEXT,
ADD COLUMN     "testimonialRequestSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialExpiryNotified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "clubsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "otherFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "parent2Email" TEXT,
ADD COLUMN     "parent2Name" TEXT,
ADD COLUMN     "parent2Phone" TEXT,
ADD COLUMN     "parent2PhoneHash" TEXT,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentPhoneHash" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "sportsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tuitionFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OTPCode" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolUser" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanUpgradeRequest" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "currentPlan" TEXT NOT NULL,
    "requestedPlan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanUpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bursary" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "approvedBy" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bursary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeCategory" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FeeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolNote" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingRecord" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "schoolId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderSchedule" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "time" TEXT NOT NULL DEFAULT '08:00',
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER NOT NULL DEFAULT 30,
    "defaultPlan" TEXT NOT NULL DEFAULT 'Starter',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "announcement" TEXT NOT NULL DEFAULT '',
    "notifyNewSchool" BOOLEAN NOT NULL DEFAULT true,
    "notifyTrialExpiry" BOOLEAN NOT NULL DEFAULT true,
    "notifyUpgradeRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyAccountDeleted" BOOLEAN NOT NULL DEFAULT true,
    "companyName" TEXT NOT NULL DEFAULT 'Elimu Pay',
    "adminName" TEXT NOT NULL DEFAULT 'David Njiru',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "kraPin" TEXT NOT NULL DEFAULT '',
    "startingInvoiceNumber" INTEGER NOT NULL DEFAULT 1000,
    "invoiceDueDays" INTEGER NOT NULL DEFAULT 30,
    "lateInterestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailSignature" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAnnouncement" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'all',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeDiscount" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "applicableTo" TEXT NOT NULL DEFAULT 'individual',
    "className" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isSiblingDiscount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDiscount" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "discountId" INTEGER NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT,

    CONSTRAINT "StudentDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "term1Start" TIMESTAMP(3),
    "term1End" TIMESTAMP(3),
    "term2Start" TIMESTAMP(3),
    "term2End" TIMESTAMP(3),
    "term3Start" TIMESTAMP(3),
    "term3End" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamFee" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "targetClass" TEXT NOT NULL,
    "academicYear" INTEGER,
    "dueDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExamFee" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "examFeeId" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentExamFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "quote" TEXT,
    "authorName" TEXT,
    "authorTitle" TEXT,
    "schoolName" TEXT,
    "rating" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "requestSentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OTPCode_userId_idx" ON "OTPCode"("userId");

-- CreateIndex
CREATE INDEX "OTPCode_expiresAt_idx" ON "OTPCode"("expiresAt");

-- CreateIndex
CREATE INDEX "SchoolUser_userId_idx" ON "SchoolUser"("userId");

-- CreateIndex
CREATE INDEX "SchoolUser_schoolId_idx" ON "SchoolUser"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolUser_schoolId_userId_key" ON "SchoolUser"("schoolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bursary_studentId_key" ON "Bursary"("studentId");

-- CreateIndex
CREATE INDEX "Bursary_active_idx" ON "Bursary"("active");

-- CreateIndex
CREATE INDEX "FeeCategory_studentId_idx" ON "FeeCategory"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BillingRecord_schoolId_month_year_key" ON "BillingRecord"("schoolId", "month", "year");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_idx" ON "Invoice"("schoolId");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_status_idx" ON "Invoice"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_studentId_term_key" ON "Invoice"("studentId", "term");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_idx" ON "AuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_schoolId_key" ON "Contract"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSchedule_schoolId_key" ON "ReminderSchedule"("schoolId");

-- CreateIndex
CREATE INDEX "ReminderSchedule_enabled_idx" ON "ReminderSchedule"("enabled");

-- CreateIndex
CREATE INDEX "FeeDiscount_schoolId_idx" ON "FeeDiscount"("schoolId");

-- CreateIndex
CREATE INDEX "FeeDiscount_active_idx" ON "FeeDiscount"("active");

-- CreateIndex
CREATE INDEX "StudentDiscount_studentId_idx" ON "StudentDiscount"("studentId");

-- CreateIndex
CREATE INDEX "StudentDiscount_discountId_idx" ON "StudentDiscount"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentDiscount_studentId_discountId_key" ON "StudentDiscount"("studentId", "discountId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear"("schoolId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_isActive_idx" ON "AcademicYear"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_year_key" ON "AcademicYear"("schoolId", "year");

-- CreateIndex
CREATE INDEX "ExamFee_schoolId_idx" ON "ExamFee"("schoolId");

-- CreateIndex
CREATE INDEX "ExamFee_schoolId_active_idx" ON "ExamFee"("schoolId", "active");

-- CreateIndex
CREATE INDEX "StudentExamFee_studentId_idx" ON "StudentExamFee"("studentId");

-- CreateIndex
CREATE INDEX "StudentExamFee_examFeeId_idx" ON "StudentExamFee"("examFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExamFee_studentId_examFeeId_key" ON "StudentExamFee"("studentId", "examFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_schoolId_key" ON "Testimonial"("schoolId");

-- CreateIndex
CREATE INDEX "Testimonial_approved_idx" ON "Testimonial"("approved");

-- CreateIndex
CREATE INDEX "Payment_schoolId_idx" ON "Payment"("schoolId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_mpesaRef_idx" ON "Payment"("mpesaRef");

-- CreateIndex
CREATE INDEX "Payment_schoolId_matched_idx" ON "Payment"("schoolId", "matched");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE INDEX "Payment_source_idx" ON "Payment"("source");

-- CreateIndex
CREATE INDEX "School_paybill_idx" ON "School"("paybill");

-- CreateIndex
CREATE INDEX "School_currentPlan_idx" ON "School"("currentPlan");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- CreateIndex
CREATE INDEX "Student_schoolId_class_idx" ON "Student"("schoolId", "class");

-- CreateIndex
CREATE INDEX "Student_parentPhone_idx" ON "Student"("parentPhone");

-- CreateIndex
CREATE INDEX "Student_schoolId_parentPhone_idx" ON "Student"("schoolId", "parentPhone");

-- CreateIndex
CREATE INDEX "Student_parentPhoneHash_idx" ON "Student"("parentPhoneHash");

-- CreateIndex
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");

-- AddForeignKey
ALTER TABLE "OTPCode" ADD CONSTRAINT "OTPCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolUser" ADD CONSTRAINT "SchoolUser_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolUser" ADD CONSTRAINT "SchoolUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanUpgradeRequest" ADD CONSTRAINT "PlanUpgradeRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bursary" ADD CONSTRAINT "Bursary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCategory" ADD CONSTRAINT "FeeCategory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolNote" ADD CONSTRAINT "SchoolNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderSchedule" ADD CONSTRAINT "ReminderSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDiscount" ADD CONSTRAINT "FeeDiscount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "FeeDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamFee" ADD CONSTRAINT "ExamFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExamFee" ADD CONSTRAINT "StudentExamFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExamFee" ADD CONSTRAINT "StudentExamFee_examFeeId_fkey" FOREIGN KEY ("examFeeId") REFERENCES "ExamFee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

