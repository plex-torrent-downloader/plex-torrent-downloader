// SearchTorrent.tsx
import GenericTorrent from "~/components/GenericTorrent";
import {SearchResults} from "@prisma/client";

interface Props {
    torrent: SearchResults;
    isDownloaded: boolean;
    handleDownload: () => void;
}

export default function SearchTorrent(props: Props) {
    let { torrent, isDownloaded, handleDownload } = props;
    return (
        <GenericTorrent
            name={torrent.name}
            seeders={torrent.seeders}
            leechers={torrent.leechers}
            size={torrent.fileSize}
            isSearchResult={true}
            status={isDownloaded ? 'Downloaded' : 'Available For Download'}
            variant={isDownloaded ? 'success' : 'search'}
            actions={[
                {
                    name: 'Download',
                    variant: 'success',
                    action: handleDownload
                },
            ]}
        />
    );
}
