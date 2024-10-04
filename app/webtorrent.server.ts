import WebTorrent from 'webtorrent';
const webtorrent = new WebTorrent();

export default async function getWebTorrentClient() {
    return webtorrent;
};
