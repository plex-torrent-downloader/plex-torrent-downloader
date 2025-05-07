import { defineConfig } from "cypress";
import {db} from './app/db.server';
import {Collections, Downloaded, ScheduledDownloads, Settings} from "@prisma/client";

const tasks = {
    async clearSettings() {
        await db.settings.deleteMany();
        return null;
    },

    async clearCollections() {
        await db.scheduledDownloads.deleteMany();
        await db.collections.deleteMany();
        return null;
    },

    async clearScheduledDownloads(): Promise<null> {
        await db.scheduledDownloads.deleteMany();
        await db.collections.deleteMany();
        await db.collections.create({
            data: {
                name: "Movies",
                location: "[content_root]/tmp"
            }
        });
        return null;
    },

    async clearHistory(): Promise<null> {
        await db.downloaded.deleteMany();
        return null;
    },

    async setSettings(password) {
        await db.settings.deleteMany();
        await db.settings.create({
            data: {
                fileSystemRoot: '/',
                searchEngine: 'The Pirate Bay',
                cacheSearchResults: true,
                saveDownloadHistory: true,
                password: password || null
            }
        })
        return null;
    },

    async setHistory(): Promise<Downloaded[]> {
        await db.downloaded.deleteMany();
        await db.downloaded.create({
            data: {
                name: 'edubuntu-24.04.2-desktop-amd64.iso',
                hash: '8f082230ceac2695b11b5617a574ea76f4f2d411',
                pathOnDisk: '/tmp',
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: new Date(),
            }
        });
        const downloaded = await db.downloaded.findMany()
        return downloaded;
    },

    async setCache(): Promise<null> {
        await db.searchResults.deleteMany();
        await db.searchResults.create({
            data: {
                searchTerm: 'Ubuntu',
                searchEngine: 'The Pirate Bay',
                name: 'edubuntu-24.04.2-desktop-amd64.iso',
                hash: '8f082230ceac2695b11b5617a574ea76f4f2d411',
                magnet: 'magnet:?xt=urn:btih:8f082230ceac2695b11b5617a574ea76f4f2d411&dn=edubuntu-24.04.2-desktop-amd64.iso',
                seeders: 100,
                leechers: 10,
                fileSize: "1000000000",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        await db.collections.deleteMany();
        await db.collections.create({
            data: {
                name: "Movies",
                location: "[content_root]/tmp"
            }
        });
        return null;
    },

    async setScheduledDownloads(): Promise<null> {
        await db.scheduledDownloads.deleteMany();
        await db.collections.deleteMany();
        const collection = await db.collections.create({
            data: {
                name: "Movies",
                location: "[content_root]/tmp"
            }
        });
        await db.scheduledDownloads.create({
            data: {
                searchTerm: 'Mulan',
                engine: '1377x.to',
                seasonNumber: 1,
                episodeNumber: 1,
                dayOfWeek: 1,
                collectionId: collection.id
            }
        });
        return null;
    },

    async stageCollectionsForDelete(): Promise<null> {
        await db.scheduledDownloads.deleteMany();
        await db.collections.deleteMany();
        await db.collections.create({
            data: {
                name: "Movies",
                location: "[content_root]/tmp"
            }
        });
        await db.collections.create({
            data: {
                name: "Collection 2",
                location: "[content_root]/tmp"
            }
        });
        return null;
    },

    async getSettings():Promise<Settings> {
        const settings = await db.settings.findFirst()
        return settings;
    },

    async getDownloadHistory():Promise<Downloaded[]> {
        const downloaded = await db.downloaded.findMany();
        return downloaded;
    },

    async getAllCollections(): Promise<Collections[]> {
        const collections = await db.collections.findMany()
        return collections;
    },

    async getAllScheduledDownloads(): Promise<ScheduledDownloads[]> {
        const scheduledDownloads = await db.scheduledDownloads.findMany()
        return scheduledDownloads;
    },
};

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', tasks)
    },
  },
});
