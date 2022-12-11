import GenericTorrent from "~/components/GenericTorrent";
import {SearchResults} from "@prisma/client";

export interface Props {
    torrent: SearchResults;
    handleDownload: () => any;
}

export default function SearchTorrent(props: Props) {
    const torrent = props.torrent;
    return <GenericTorrent
        name={torrent.name}
        seeders={torrent.seeders}
        leechers={torrent.leechers}
        size={torrent.fileSize}
        isSearchResult={true}
        status={'Available For Download'}
        background="linear-gradient(180deg, rgba(7,83,249,0.9682466736694678) 0%, rgba(47,175,255,1) 45%, rgba(7,83,249,1) 100%);"
        actions={[
            {name: 'Download', btnClass: 'btn btn-success w-100', action: props.handleDownload},
        ]}
    />
}
