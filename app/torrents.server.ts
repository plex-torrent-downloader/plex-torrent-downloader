import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {db} from './db.server';
import webtorrent from "~/webtorrent.server";
import {Torrent} from "webtorrent";

class torrentsManager {
    get torrents():Torrent[] {
        return webtorrent.torrents;
    }

    async addTorrent(torrent, path: string){
        const {saveDownloadHistory} = await db.settings.findUnique({
            where: {id: 1}
        });
        if (!saveDownloadHistory) {
            return;
        }
        const {id} = await db.downloaded.upsert({
            where: {
                hash: torrent.infoHash
            },
            create: {
                name: torrent.name,
                hash: torrent.infoHash,
                pathOnDisk: path
            },
            update: {
                deletedAt: null,
                completedAt: torrent.progress ? new Date() : null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        torrent.on('done', async () => {
            await db.downloaded.update({
                data: {
                    completedAt: new Date(),
                    deletedAt: null
                },
                where: {
                    id
                }
            })
        });
    }
    async removeTorrent(hash: string):Promise<void> {
        const torrent = this.torrents.find(t => t.infoHash === hash);

        if (!torrent) {
            throw new Error(`Torrent for hash ${hash} does not exist.`);
        }

        torrent.destroy();
    }
    async deleteTorrent(hash: string):Promise<void> {
        const torrent = this.torrents.find(t => t.infoHash === hash);

        if (!torrent) {
            throw new Error(`Torrent for hash ${hash} does not exist.`);
        }

        torrent.destroy({destroyStore: true});
        this.torrents.splice(this.torrents.indexOf(torrent), 1);
        await db.downloaded.update({
            data: {
                deletedAt: new Date()
            },
            where: {
                hash
            }
        });
    }
    private serialize(torrent: any):WebTorrent {
        return {
            name: torrent.name,
            hash: torrent.infoHash,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            progress: (torrent.progress * 100).toFixed(1) + '%',
            numPeers: torrent.numPeers,
            path: torrent.path,
            done: !!torrent.done,
            class: (torrent.done ? 'table-success' : 'table-danger')
        }
    }
    getSerialized() {
        return this.torrents.map(this.serialize);
    }
}


export default new torrentsManager();
