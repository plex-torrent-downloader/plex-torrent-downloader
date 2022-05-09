import {useState} from "react";
import {Torrent} from "~/tpb.server";
import {useLoaderData} from "@remix-run/react";
import axios from "axios";

interface Props {
    torrent: Torrent;
    onClose?: () => any;
    children?: any;
}

export default function AddTorrentModal(props: Props) {
    const {collections, settings} = useLoaderData();
    const {torrent} = props;
    const [collection, setCollection] = useState<number>(null);
    const path = collection ? collections[collection].location.replace("[content_root]", settings.fileSystemRoot).replace('//', '/') : null;

    async function submit():Promise<any> {
        await axios({
            method: 'POST',
            url: '/add',
            data: {
                hash: props.torrent.hash,
                path
            }
        });
        if (props.onClose) {
            props.onClose();
        }
    }
    return <div className="modal" id="exampleModal"  role="dialog" style={{display: 'block'}}>
        <div className="modal-dialog" role="document">
            <div className="modal-content" style={{width: '750px'}}>
                <div className="modal-header">
                    <h5 className="modal-title">Download {torrent.name.substr(0, 45) + '...'}</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={e => props.onClose()}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body">
                    <h5>Please Review the following torrent download:</h5>
                    <table className="table w-100">
                        <tbody>
                            <tr>
                                <td>Name</td>
                                <td>{torrent.name}</td>
                            </tr>
                            <tr>
                                <td>Size</td>
                                <td>{torrent.fileSize}</td>
                            </tr>
                            <tr>
                                <td>Seeders</td>
                                <td>{torrent.seeders}</td>
                            </tr>
                            <tr>
                                <td>Infohash</td>
                                <td>{torrent.hash}</td>
                            </tr>
                            <tr>
                                <td>Download To:</td>
                                <td>
                                    <select className="w-100" value={collection} onChange={e => setCollection(e.target.value)}>
                                        <option selected={true} disabled={true}>Select an Option</option>
                                        {collections.map((collection, index) => <option value={index}>{collection.name}</option>)}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td>Path on disk:</td>
                                <td>
                                    {path}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={e => props.onClose()}>Cancel</button>
                    <button type="button" className="btn btn-success" disabled={!collection} onClick={submit}>Start Download</button>
                </div>
            </div>
        </div>
    </div>;
}
