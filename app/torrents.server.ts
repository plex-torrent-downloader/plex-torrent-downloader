import {WebTorrent} from "~/contracts/WebTorrentInterface";

class torrentsManager {
    private torrents: any[] = [];
    getTorrents(){
        return this.torrents;
    }
    addTorrent(torrent){
        this.torrents.push(torrent);
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
            done: !!torrent.done
        }
    }
    getSerialized() {
        return this.torrents.map(this.serialize);
    }
}


export default new torrentsManager();
