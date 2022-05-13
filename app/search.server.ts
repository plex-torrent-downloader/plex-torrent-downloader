import {db} from './db.server';
import {Torrent, tpb} from './tpb.server';
import {SearchResults} from '@prisma/client';

class Search {
    public async search(q: string):Promise<SearchResults[]> {
        let findInDb;
        if (findInDb = await this.findInDb(q)) {
            return findInDb;
        }
        const results = await tpb(q);
        return await this.saveResults(q, results);
    }

    private async findInDb(q: string):Promise<SearchResults[]> {
        const results = await db.searchResults.findMany({
            where: {searchTerm: q},
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

    private async saveResults(q: string, results: Torrent[]):Promise<SearchResults[]> {
        return db.$transaction([
            ...results.map((t: Torrent) => {
                return db.searchResults.create({
                    data: {
                        searchTerm: q,
                        name: t.name,
                        hash: t.hash,
                        fileSize: t.fileSize,
                        seeders: +t.seeders,
                        leechers: +t.leechers
                    }
                })
            })
        ]);
    }
}
export default new Search();
