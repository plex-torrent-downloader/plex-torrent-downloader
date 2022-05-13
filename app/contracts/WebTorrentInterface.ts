export interface WebTorrent {
    name: string;
    hash: string;
    downloadSpeed: string;
    uploadSpeed: string;
    progress: string;
    numPeers: number;
    path: string;
    done: boolean;
    class: string;
}
