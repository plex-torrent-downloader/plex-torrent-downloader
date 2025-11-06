import GenericTorrent, {Action} from "~/components/GenericTorrent";
import type { WebTorrent } from "../contracts/WebTorrentInterface";
import {useLoaderData, useNavigate} from "@remix-run/react";
import { useSocket } from "~/contexts/QueueContext";

interface Props {
    torrent: WebTorrent;
    onSoftDelete: () => Promise<void>;
    onHardDelete: () => Promise<void>;
}

export default function WebTorrent(props: Props) {
    let { torrent, onSoftDelete, onHardDelete } = props;
    const {settings} = useLoaderData();
    const navigate = useNavigate();
    const { socket } = useSocket();

    const actions:Action[] = [
        {
            name: 'Stop Downloading',
            variant: 'primary',
            action: onSoftDelete
        },
        {
            name: 'Delete all Files',
            variant: 'danger',
            action: onHardDelete
        }
    ];

    if (torrent?.percent === 100) {
        actions.push({
            name: 'Transcode to MKV',
            variant: 'primary',
            action: () => {
                socket.emit('transcodeToMkv', torrent);
            }
        });

        if (settings?.saveDownloadHistory) {
            actions.push({
                name: 'Watch',
                variant: 'primary',
                action: () => navigate(`/watch/${torrent.hash}`),
            });
        }
    }


    return (
        <GenericTorrent
            name={torrent.name}
            seeders={torrent.seeders}
            leechers={torrent.leechers}
            progress={torrent.progressPercent}
            isSearchResult={false}
            downloadSpeed={+torrent.downloadSpeed}
            uploadSpeed={+torrent.uploadSpeed}
            status={torrent?.done ? 'Completed' : 'Downloading'}
            peers={torrent.numPeers}
            variant={torrent?.done ? 'success' : 'default'}
            actions={actions}
        />
    );
}
