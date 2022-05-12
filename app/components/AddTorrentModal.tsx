import {useState} from "react";
import {Torrent} from "~/tpb.server";
import {useLoaderData} from "@remix-run/react";
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
    const path = collection ? props.collections[collection].location.replace("[content_root]", props.settings.fileSystemRoot).replace('//', '/') : null;

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
    return <Modal title={`Download ${torrent.name.substr(0, 45)}...`} onClose={() => props.onClose()} disabled={!path || hash.length !== 40} buttons={[
        {
            label: 'Start Download',
            action: async () => {
                await submit();
            },
            class: 'btn btn-success'
        }
    ]}>
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
                <td>
                    <input className="w-100" type="text" value={hash} onChange={e => setHash(e.target.value)} />
                </td>
            </tr>
            <tr>
                <td>Download To:</td>
                <td>
                    <select className="w-100" value={collection ?? undefined} onChange={e => setCollection(e.target.value)}>
                        <option selected={true} disabled={true}>Select an Option</option>
                        {props.collections && props.collections.map((collection, index) => <option key={index} value={index}>{collection.name}</option>)}
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
    </Modal>;
}
