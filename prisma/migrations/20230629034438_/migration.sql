-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_system_root" TEXT NOT NULL,
    "search_engine" TEXT NOT NULL DEFAULT '1377x.to',
    "cache_search_results" BOOLEAN NOT NULL DEFAULT true,
    "save_download_history" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "collections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "search_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "search_term" TEXT NOT NULL,
    "search_engine" TEXT,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "seeders" INTEGER,
    "leechers" INTEGER NOT NULL,
    "fileSize" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "recent_searches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "search_term" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "downloaded" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "path_on_disk" TEXT NOT NULL,
    "completed_at" DATETIME,
    "deleted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_name_key" ON "collections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "recent_searches_search_term_key" ON "recent_searches"("search_term");

-- CreateIndex
CREATE UNIQUE INDEX "downloaded_hash_key" ON "downloaded"("hash");
