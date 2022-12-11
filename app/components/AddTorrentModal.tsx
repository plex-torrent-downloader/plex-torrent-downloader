import {useState} from "react";
import {Torrent} from "~/search.server";
import axios from "axios";
import Modal from "~/components/Modal";
import {Collections, Settings} from "@prisma/client";

interface Props {
    torrent: Torrent;
    onClose: () => any;
    children?: any;
    collections: Collections[],
    settings: Settings
}

export default function AddTorrentModal(props: Props) {
    const {torrent} = props;
    const [collection, setCollection] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [hash, setHash] = useState<string>(props.torrent.hash);
    const path: string = collection ? props.collections[collection].location.replace("[content_root]", props.settings.fileSystemRoot).replace('//', '/') : null;

    async function submit():Promise<any> {
        await axios({
            method: 'POST',
            url: '/add',
            data: {
                hash,
                path
            }
        });
        setShowSuccess(true);
    }

    if (showSuccess) {
        return <Modal title="Success" onClose={() => props.onClose()} buttons={[
            {
                label: "Open Download Queue",
                class: "btn btn-success",
                action(){
                    window.location.href = "/queue";
                }
            }
        ]}>
            <h5>The torrent is now downloading.</h5>
        </Modal>
    }

    return <Modal title={"Start New Download"} onClose={() => props.onClose()} disabled={!path || hash.length !== 40} buttons={[
        {
            label: 'Start Download',
            action: async () => {
                await submit();
            },
            class: 'btn btn-success'
        }
    ]}>
        <h5>Please Review the following torrent download:</h5>
        <table className="table">
            <tbody>
            <tr>
                <td>Name</td>
                <td>{torrent.name.substring(0, 30)}...</td>
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
                <td>
                    <input className="w-50" type="text" value={hash} onChange={e => setHash(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>Destination:</td>
                <td>
                    <select className="w-50" value={collection ?? undefined} onChange={e => setCollection(e.target.value)}>
                        <option selected={true} disabled={true}>Select an Option</option>
                        {props.collections && props.collections.map((collection, index) => <option key={index} value={index}>{collection.name}</option>)}
                    </select>
                </td>
            </tr>
            <tr>
                <td>Path:</td>
                <td>
                    {path}
                </td>
            </tr>
            </tbody>
        </table>
        <pre className="w-100" style={{
            inlineSize: '100px',
            overflowWrap: 'break-word'
        }}>
            {torrent.name}
        </pre>
    </Modal>;
}
