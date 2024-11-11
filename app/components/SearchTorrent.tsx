// SearchTorrent.tsx
import GenericTorrent, {Props} from "~/components/GenericTorrent";

export default function SearchTorrent({ torrent, isDownloaded, handleDownload }: Props) {
    //console.log('hash', torrent.hash);
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
