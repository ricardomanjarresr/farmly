/*
  Warnings:

  - You are about to drop the column `listingId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Order` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ShippingPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "targetQty" REAL NOT NULL,
    "currentQty" REAL NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShippingPool_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "priceAgreed" REAL NOT NULL,
    CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderLine_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "shippingMode" TEXT NOT NULL DEFAULT 'flat_fee',
    "freeShippingMinAmount" REAL,
    "flatFeeAmount" REAL,
    "flatFeeRadiusKm" REAL,
    "poolThresholdQty" REAL,
    "poolDeadlineHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Farm" ("createdAt", "id", "name", "telegramChatId", "town") SELECT "createdAt", "id", "name", "telegramChatId", "town" FROM "Farm";
DROP TABLE "Farm";
ALTER TABLE "new_Farm" RENAME TO "Farm";
CREATE UNIQUE INDEX "Farm_telegramChatId_key" ON "Farm"("telegramChatId");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerLat" REAL,
    "buyerLng" REAL,
    "buyerTelegramChatId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Order" ("buyerName", "buyerPhone", "createdAt", "id", "status") SELECT "buyerName", "buyerPhone", "createdAt", "id", "status" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ShippingPool_listingId_key" ON "ShippingPool"("listingId");
