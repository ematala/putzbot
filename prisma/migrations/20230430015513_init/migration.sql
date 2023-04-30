-- CreateTable
CREATE TABLE "Roomie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dutyId" INTEGER,
    CONSTRAINT "Roomie_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Duty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trash" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TrashCollection" (
    "date" DATETIME NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "_TrashToTrashCollection" (
    "A" INTEGER NOT NULL,
    "B" DATETIME NOT NULL,
    CONSTRAINT "_TrashToTrashCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Trash" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TrashToTrashCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "TrashCollection" ("date") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Roomie_dutyId_key" ON "Roomie"("dutyId");

-- CreateIndex
CREATE UNIQUE INDEX "_TrashToTrashCollection_AB_unique" ON "_TrashToTrashCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_TrashToTrashCollection_B_index" ON "_TrashToTrashCollection"("B");
