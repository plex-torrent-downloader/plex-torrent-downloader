import GenericTorrent, {Action} from "~/components/GenericTorrent";
import {Downloaded} from "@prisma/client";
import moment from "moment";

export interface Props {
    torrent: Downloaded;
    actions: Action[];
}

export default function DownloadHistoryTorrrent(props: Props) {
    const torrent = props.torrent;
    return <GenericTorrent
        name={torrent.name}
        isSearchResult={true}
        background={getRowColor(torrent)}
        status={getStatus(torrent)}
        actions={props.actions}
        timestamp={moment(props.torrent.createdAt)}
    />
}

export function getStatus(downloaded: Downloaded): string {
    if (downloaded.completedAt && downloaded.deletedAt) {
        if (downloaded.completedAt > downloaded.deletedAt) {
            return 'Completed';
        }
        if (downloaded.completedAt < downloaded.deletedAt) {
            return 'Deleted';
        }
    }
    if (downloaded.completedAt) {
        return 'Completed';
    }
    if (downloaded.deletedAt) {
        return 'Deleted';
    }
    return 'Downloading';
}


function getRowColor(downloaded: Downloaded): string {
    switch(getStatus(downloaded)) {
        case 'Completed':
            return 'linear-gradient(90deg, rgba(13,163,8,1) 0%, rgba(13,163,8,1) 20%, rgba(0,0,0,1) 45%, rgba(0,0,0,1) 100%);';
        case 'Deleted':
            return 'linear-gradient(90deg, rgba(245,18,0,1) 0%, rgba(245,18,0,1) 20%, rgba(0,0,0,1) 45%, rgba(0,0,0,1) 100%);';
        case 'Downloading':
        default:
            return 'linear-gradient(90deg, rgba(245,154,0,1) 0%, rgba(245,154,0,1) 20%, rgba(0,0,0,1) 45%, rgba(0,0,0,1) 100%);';
    }
}
