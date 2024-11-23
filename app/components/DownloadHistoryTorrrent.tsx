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
