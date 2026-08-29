-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "shopName" TEXT NOT NULL DEFAULT 'Shinzi Computer',
    "logoUrl" TEXT,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "headerNote" TEXT,
    "footerNote" TEXT,
    "startingReceiptNo" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSettings" ("address", "footerNote", "headerNote", "id", "phone", "startingReceiptNo", "updatedAt") SELECT "address", "footerNote", "headerNote", "id", "phone", "startingReceiptNo", "updatedAt" FROM "ShopSettings";
DROP TABLE "ShopSettings";
ALTER TABLE "new_ShopSettings" RENAME TO "ShopSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
