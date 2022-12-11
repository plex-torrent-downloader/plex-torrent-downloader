export interface WebTorrent {
    name: string;
    hash: string;
    seeders: number;
    leechers: number;
    downloadSpeed: string;
    uploadSpeed: string;
    progress: string;
    progressPercent: number;
    numPeers: number;
    path: string;
    done: boolean;
    class: string;
}
