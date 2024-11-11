import GenericTorrent, {Props} from "~/components/GenericTorrent";

export default function WebTorrent({ torrent, onSoftDelete, onHardDelete }: Props) {
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
            actions={[
                {
                    name: 'Stop Downloading',
                    variant: 'primary',
                    action: onSoftDelete
                },
                {
                    name: 'Delete all Files',
                    variant: 'danger',
                    action: onHardDelete
                },
                {
                    name: 'Continue Downloading',
                    variant: 'success',
                    action: () => {}
                },
            ]}
        />
    );
}
