-- AlterEnum
ALTER TYPE "TripStatus" ADD VALUE 'DREAMING';

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "outboundFlight" TEXT,
ADD COLUMN     "returnFlight" TEXT,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;
