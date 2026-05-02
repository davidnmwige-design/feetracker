/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[admNo,schoolId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_admNo_key";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "School_userId_key" ON "School"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admNo_schoolId_key" ON "Student"("admNo", "schoolId");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
