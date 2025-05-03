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
                name: 'Mulan',
                hash: '1234567890',
                pathOnDisk: '/downloads/mulan.torrent',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        const downloaded = await db.downloaded.findMany()
        return downloaded;
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
};

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', tasks)
    },
  },
});
