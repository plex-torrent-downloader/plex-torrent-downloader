import {db} from './db.server';
import search1377 from './search1377xto.server';
import searchNyaaSe from './searchnyaasi.server';
import searchTPB from './searchTPB.server';
import {SearchResults} from '@prisma/client';

export enum SearchEngine {
    X1377 = "1377x.to",
    NYAASI = "nyaa.si",
    TPB = 'The Pirate Bay',
}

export interface Torrent {
    name: string;
    seeders: number;
    leechers: number;
    hash: string;
    magnet: string;
    fileSize: string;
    link?: string;
}

class Search {
    public async search(q: string): Promise<SearchResults[]> {
        await this.saveSearch(q);
        const {cacheSearchResults, searchEngine} = await db.settings.findFirst();
        if (cacheSearchResults) {
            let findInDb = await this.findInDb(q, searchEngine as SearchEngine);
            if (findInDb) {
                return findInDb;
            }
            const results = await this.searchThroughEngine(q, searchEngine as SearchEngine);
            return await this.saveResults(q, results, searchEngine as SearchEngine);
        }
        return await this.searchThroughEngine(q, searchEngine as SearchEngine);
    }

    public async searchThroughEngine(q: string, engine: SearchEngine): Promise<SearchResults[]> {
        let results: Torrent[] = [];
        switch (engine) {
            case SearchEngine.X1377:
                results = await search1377(q);
                break;
            case SearchEngine.NYAASI:
                results = await searchNyaaSe(q);
                break;
            case SearchEngine.TPB:
                results = await searchTPB(q);
                break;
            default:
                throw new Error(`Invalid Search Engine: ${engine}`);
        }

        return results
            .sort((a, b) => a.seeders < b.seeders ? 1 : -1)
            .map((t:Torrent): SearchResults => this.torrent2SearchResult(t, engine));
    }

    private async findInDb(q: string, searchEngine: SearchEngine): Promise<SearchResults[] | null> {
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

    private async saveResults(q: string, results: Torrent[], searchEngine: SearchEngine): Promise<SearchResults[]> {
        return db.$transaction([
            ...results.map((t: Torrent) => {
                return db.searchResults.create({
                    data: {
                        searchTerm: q,
                        searchEngine,
                        name: t.name,
                        hash: t.hash,
                        magnet: t.magnet,
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

    private torrent2SearchResult(torrent: Torrent, searchEngine: SearchEngine = SearchEngine.X1377): SearchResults {
        return {
            id: 123,
            searchTerm: torrent.name,
            searchEngine,
            name: torrent.name,
            hash: torrent.hash,
            magnet: torrent.magnet,
            seeders: torrent.seeders,
            leechers: torrent.leechers,
            fileSize: torrent.fileSize,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    }

    private async saveSearch(searchTerm: string): Promise<void> {
        const o = {searchTerm};
        await db.recentSearches.upsert({
            where: o,
            create: o,
            update: o
        });
    }

    public getSearchEngines(): string[] {
        return Object.values(SearchEngine);
    }
}

export default new Search();
