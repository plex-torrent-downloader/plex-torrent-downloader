let webtorrentInstance: any | null = null;

export default async function getWebTorrentClient() {
    if (!webtorrentInstance) {
        const { default: WebTorrent } = await import('webtorrent');
        webtorrentInstance = new WebTorrent();

        webtorrentInstance.on('error', (error: Error) => {
            console.error('WebTorrent Error:', error);
        });
    }
    return webtorrentInstance;
};
