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
            await this.searchForEpisode(result);
        }
    }

    async searchForEpisode(download: ScheduledDownloads): Promise<boolean> {
        const searchQuery = this.createSearchQuery(download);
        const searchResults = await search.searchThroughEngine(searchQuery, download.engine as SearchEngine);
        if (!searchResults.length) {
            return false;
        }
        const collection = await db.collections.findUnique({where: {id: download.collectionId}});
        if (!collection) {
            return false;
        }
        const magnet:string = searchResults[0].magnet;
        const Settings = await db.settings.findFirst();
        const pathOnDisk = collection.location.replace('[content_root]', Settings.fileSystemRoot);
        await torrents.addMagnet(magnet, pathOnDisk);
        await db.scheduledDownloads.update({
            where: {id: download.id},
            data: {
                lastDownloaded: new Date(),
                episodeNumber: download.episodeNumber + 1
            }
        });
        return true;
    }
}
