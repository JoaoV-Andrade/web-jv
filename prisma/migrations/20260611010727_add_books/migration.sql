-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('WANT_TO_READ', 'READING', 'READ');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "rating" INTEGER,
    "coverUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
