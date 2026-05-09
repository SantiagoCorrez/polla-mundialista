-- AlterTable
ALTER TABLE "User" ADD COLUMN "cedula" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

-- CreateIndex
CREATE UNIQUE INDEX "User_cedula_key" ON "User"("cedula");
