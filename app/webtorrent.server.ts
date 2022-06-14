import WebTorrent from 'webtorrent';

const webtorrent = new WebTorrent();

webtorrent.on('error', e => {
    console.error(e);
});

export default webtorrent;
