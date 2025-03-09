-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "zoneKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minutesRequired" INTEGER NOT NULL,
    "pointsGranted" INTEGER NOT NULL,
    "lastUsage" TIMESTAMP(3),
    "totalSecondsInZone" INTEGER NOT NULL DEFAULT 0,
    "deletedInDiscord" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
