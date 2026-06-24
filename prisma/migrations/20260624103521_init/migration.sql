-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "openingBalanceMinor" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "archivedAt" DATETIME,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payee" TEXT,
    "categoryId" TEXT,
    "aiConfidence" REAL,
    "source" TEXT NOT NULL,
    "rawCsvRow" TEXT,
    "dedupeHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategorizationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchType" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdFromCorrection" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CategorizationRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QaHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "askedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT NOT NULL,
    "generatedSql" TEXT,
    "resultJson" TEXT,
    "wasUseful" BOOLEAN
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_dedupeHash_key" ON "Transaction"("dedupeHash");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_categoryId_month_key" ON "Budget"("categoryId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_date_base_quote_key" ON "ExchangeRate"("date", "base", "quote");
