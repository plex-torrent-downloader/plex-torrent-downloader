import GenericTorrent from "~/components/GenericTorrent";
import {SearchResults} from "@prisma/client";

export interface Props {
    torrent: SearchResults;
    isDownloaded: boolean;
    handleDownload: () => any;
}

export default function SearchTorrent(props: Props) {
    const {torrent, isDownloaded} = props;
    const background = isDownloaded ?
        "linear-gradient(95deg, rgba(49,195,34,1) 0%, rgba(44,250,243,1) 91%, rgba(45,79,253,1) 100%);" :
        "linear-gradient(180deg, rgba(7,83,249,0.9682466736694678) 0%, rgba(47,175,255,1) 45%, rgba(7,83,249,1) 100%);";
    return <GenericTorrent
        name={torrent.name}
        seeders={torrent.seeders}
        leechers={torrent.leechers}
        size={torrent.fileSize}
        isSearchResult={true}
        status={isDownloaded ? 'Downloaded' : 'Available For Download'}
        background={background}
        actions={[
            {name: 'Download', btnClass: 'btn btn-success w-100', action: props.handleDownload},
        ]}
    />
}
