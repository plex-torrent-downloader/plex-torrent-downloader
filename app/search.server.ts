import {db} from './db.server';
import search1377 from './search1377xto.server';
import searchNyaaSe from './searchnyaasi.server';
import {SearchResults} from '@prisma/client';

export interface Torrent {
    name: string;
    seeders: number;
    leechers: number;
    hash: string;
    fileSize: string;
    link?: string;
}

class Search {
    public async search(q: string):Promise<SearchResults[]> {
        const {cacheSearchResults, searchEngine} = await db.settings.findUnique({where: {id : 1}});
        if (cacheSearchResults) {
            let findInDb;
            if (findInDb = await this.findInDb(q, searchEngine)) {
                return findInDb;
            }
            const results = await this.searchThroughEngine(q, searchEngine);
            return await this.saveResults(q, results, searchEngine);
        }
        return await this.searchThroughEngine(q, searchEngine);
    }

    private async searchThroughEngine(q: string, engine: string):Promise<SearchResults[]> {
        let results: Torrent[] = [];
        switch (engine.trim()) {
            case "1377x.to":
                results = await search1377(q);
                break;
            case "nyaa.si":
                results = await searchNyaaSe(q);
                break;
            default:
                throw new Error(`Invalid Search Engine: ${engine}`);
        }

        return results
            .sort((a, b) => a.seeders < b.seeders ? 1 : -1)
            .map((t:Torrent):SearchResults => this.torrent2SearchResult(t, engine));
    }

    private async findInDb(q: string, searchEngine: string):Promise<SearchResults[]> {
        const results = await db.searchResults.findMany({
            where: {searchTerm: q, searchEngine},
            orderBy: [
                {
                    seeders: 'desc'
                },
            ],
        });
        if (!results.length) {
            return null;
        }
        return results;
    }

    private async saveResults(q: string, results: Torrent[], searchEngine: string):Promise<SearchResults[]> {
        return db.$transaction([
            ...results.map((t: Torrent) => {
                return db.searchResults.create({
                    data: {
                        searchTerm: q,
                        searchEngine,
                        name: t.name,
                        hash: t.hash,
                        fileSize: t.fileSize,
                        seeders: +t.seeders,
                        leechers: +t.leechers,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            })
        ]);
    }

    private torrent2SearchResult(torrent: Torrent, searchEngine: string = ''): SearchResults {
        return {
            id: 123,
            searchTerm: torrent.name,
            searchEngine,
            name: torrent.name,
            hash: torrent.hash,
            seeders: torrent.seeders,
            leechers: torrent.leechers,
            fileSize: torrent.fileSize,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }
 }
export default new Search();
