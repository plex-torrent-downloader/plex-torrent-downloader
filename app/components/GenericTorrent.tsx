import {useState} from "react";
import Modal from "~/components/Modal";

export interface Action {
    name: string;
    action: () => any;
    btnClass: string;
}

export interface Props {
    name: string;
    status?: string;
    seeders: number;
    leechers: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    background?: string;
    progress?: number;
    isSearchResult: boolean;
    peers?: number;
    size?: string;
    actions: Action[]
}

function formatSizeUnits(bytes)
{
    if ( ( bytes >> 30 ) & 0x3FF )
        bytes = ( bytes >>> 30 ) + '.' + ( bytes & (3*0x3FF )) + 'GB' ;
    else if ( ( bytes >> 20 ) & 0x3FF )
        bytes = ( bytes >>> 20 ) + '.' + ( bytes & (2*0x3FF ) ) + 'MB' ;
    else if ( ( bytes >> 10 ) & 0x3FF )
        bytes = ( bytes >>> 10 ) + '.' + ( bytes & (0x3FF ) ) + 'KB' ;
    else if ( ( bytes >> 1 ) & 0x3FF )
        bytes = ( bytes >>> 1 ) + 'Bytes' ;
    else
        bytes = bytes + 'Byte' ;
    return bytes ;
}

export default function GenericTorrent(props: Props) {
    let {
        name,
        status,
        seeders,
        progress,
        downloadSpeed,
        peers,
        actions,
        size,
        isSearchResult,
        background
    } = props;

    if (!name) {
        name = '';
    }

    const [showModal, setShowModal] = useState<boolean>(false);

    async function click() {
        if (actions.length === 1) {
            actions[0].action();
            return;
        }
        setShowModal(true);
    }

    return <>
        {showModal && <Modal title={"Torrent Actions"} onClose={e => setShowModal(false)}>
            <GenericTorrent {...props} actions={[{name: 'fake', action: () => null, btnClass: ''}]} />
            <h2>Select an action:</h2>
            {actions.map((action: Action) => {
                const handleClick = () => {
                    action.action();
                    setShowModal(false);
                };
                return <button onClick={e => handleClick(e)} className={`${action.btnClass}`}>{action.name}</button>;
            })}
        </Modal>}
        <div className={`torrent ` + (isSearchResult ? 'searchResult' : '')} style={background ? {background} : {}} onClick={e => click(e)}>
            <span className="name">{name.substring(0, 50)}...</span>
            <span className="shelf">
            {status && <span className="status">{status}</span>}
            {peers && peers > 0 && <span className="peers">| {peers} Peers</span>}
        </span>
            <span className="shelf2">
            {size && <span className="size">Size: {size}</span>}
            {seeders && <span className="seeders">Seeders: {seeders}</span>}
            {downloadSpeed && <span className="dl">Speed: {formatSizeUnits(downloadSpeed)}</span>}
        </span>
        {!isNaN(progress) && <div className="progress" style={{width: `${progress}%`}}></div>}
        </div>
    </>
}
