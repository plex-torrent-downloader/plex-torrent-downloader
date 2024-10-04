-- CreateTable
CREATE TABLE "scheduled_downloads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "search_term" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "day_of_week" INTEGER NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "last_downloaded" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scheduled_downloads_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_downloads_search_term_season_number_episode_number_key" ON "scheduled_downloads"("search_term", "season_number", "episode_number");
