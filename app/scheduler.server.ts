import { db } from './db.server';
import { ScheduledDownloads, Collections } from '@prisma/client';
import moment from "moment";
import search, {SearchEngine} from "./search.server";
import torrents from "./torrents.server";

export default new class Scheduler {
    interval: NodeJS.Timeout;

    constructor() {
        console.log("Scheduler started");
        this.interval = setInterval(this.run.bind(this), 1000 * 60 * 20);
        this.run();
    }

    createSearchQuery(result: ScheduledDownloads): string {
        const season = `${result.seasonNumber < 10 ? '0' : ''}${result.seasonNumber}`;
        const episode = `${result.episodeNumber < 10 ? '0' : ''}${result.episodeNumber}`;
        return `${result.searchTerm} S${season}E${episode}`;
    }

    async run() {
        const results: ScheduledDownloads[] = await db.scheduledDownloads.findMany({
            where: {
                isActive: true,
                dayOfWeek: moment().day(),
                OR: [
                    { lastDownloaded: null },
                    { lastDownloaded: { lt: moment().subtract(1, 'day').toDate() } }
                ]
            }
        });

        for (const result of results) {
            const searchQuery = this.createSearchQuery(result);
            const searchResults = await search.searchThroughEngine(searchQuery, result.engine as SearchEngine);
            if (!searchResults.length) {
                continue;
            }
            const collection = await db.collections.findUnique({where: {id: result.collectionId}});
            if (!collection) {
                continue;
            }
            const magnet:string = searchResults[0].magnet;
            const Settings = await db.settings.findUnique({where: {id: 1}});
            const pathOnDisk = collection.location.replace('[content_root]', Settings.fileSystemRoot);
            torrents.addMagnet(magnet, pathOnDisk);
            await db.scheduledDownloads.update({
                where: {id: result.id},
                data: {
                    lastDownloaded: new Date(),
                    episodeNumber: result.episodeNumber + 1
                }
            });
        }
    }
}
