-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RoundStatus" NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundId" TEXT NOT NULL,
    "idNumber" VARCHAR(20) NOT NULL,
    "numbers" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundId" TEXT NOT NULL,
    "numbers" TEXT NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Draw_roundId_key" ON "Draw"("roundId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
