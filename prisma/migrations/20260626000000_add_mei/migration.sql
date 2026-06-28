-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "mei" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MeiSettings" (
    "id" TEXT NOT NULL,
    "openingMonth" INTEGER NOT NULL,
    "openingYear" INTEGER NOT NULL,
    "annualLimit" DECIMAL(10,2) NOT NULL DEFAULT 81000,
    "monthlyLimit" DECIMAL(10,2) NOT NULL DEFAULT 6750,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeiSettings_pkey" PRIMARY KEY ("id")
);
