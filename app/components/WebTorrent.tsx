import GenericTorrent from "~/components/GenericTorrent";
import {WebTorrent} from "~/contracts/WebTorrentInterface";

export interface Props {
    torrent: WebTorrent;
    onSoftDelete: () => any;
    onHardDelete: () => any;
}

export default function WebTorrent(props: Props) {
    const torrent = props.torrent;
    return <GenericTorrent
        name={torrent.name}
        seeders={torrent.seeders}
        leechers={torrent.leechers}
        progress={torrent.progressPercent}
        isSearchResult={false}
        downloadSpeed={+torrent.downloadSpeed}
        uploadSpeed={+torrent.uploadSpeed}
        status={torrent?.done ? 'Completed' : 'Downloading'}
        peers={torrent.numPeers}
        actions={[
            {name: 'Stop Downloading', btnClass: 'btn btn-primary w-100', action: props.onSoftDelete},
            {name: 'Delete all Files', btnClass: 'btn btn-danger w-100', action: props.onHardDelete},
            {name: 'Continue Downloading', btnClass: 'btn btn-success w-100', action: () => {}},
        ]}
    />
}
