import axios from "axios";
import {Torrent} from "~/search.server";
import TorrentsManager from './torrents.server';
export interface TPBTorrent {
    id: string
    name: string
    info_hash: string
    leechers: string
    seeders: string
    num_files: string
    size: string
    username: string
    added: string
    status: string
    category: string
    imdb: string
}

function getMagnet(torrent: TPBTorrent): string {
    return 'magnet:?xt=urn:btih:'+torrent.info_hash+'&dn='+encodeURIComponent(torrent.name) + TorrentsManager.trackers.reduce((acc, tracker) => {
        return `&tr=${encodeURIComponent(tracker)}${acc}`;
    }, '');
}

export default async function search(term: string):Promise<Torrent[]> {
    const {data} = await axios(`https://apibay.org/q.php?q=${encodeURIComponent(term)}&cat=`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; M1 Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36'
        }
    }) as {data: TPBTorrent[]};

    // edge case
    if (data[0]?.id === '0') {
        return [];
    }

    return data.map((t: TPBTorrent):Torrent => {
        function formatFileSize(bytes: number): string {
            if (bytes === 0) {
                return '0B';
            }

            const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            const size = bytes / Math.pow(1024, i);

            return `${parseFloat(size.toFixed(2))}${units[i]}`;
        }

        return {
            fileSize: formatFileSize(+t.size),
            hash: t.info_hash.toUpperCase(),
            leechers: +t.leechers,
            magnet: getMagnet(t),
            name: t.name,
            seeders: +t.seeders
        }
    });
}
