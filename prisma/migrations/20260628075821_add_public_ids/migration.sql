-- AddColumn publicId to School
ALTER TABLE "School" ADD COLUMN "publicId" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE "School" ADD CONSTRAINT "School_publicId_key" UNIQUE ("publicId");

-- AddColumn publicId to Student
ALTER TABLE "Student" ADD COLUMN "publicId" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE "Student" ADD CONSTRAINT "Student_publicId_key" UNIQUE ("publicId");
