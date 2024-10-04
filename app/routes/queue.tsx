import {useLoaderData, useNavigate} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {useEffect, useState} from "react";
import Modal from "~/components/Modal";
import axios from "axios";
import torrentsManager from '../torrents.server';
import WebTorrentComponent from '../components/WebTorrent';
import styles from  '../styles/torrent.css';
import {metaV1} from "@remix-run/v1-meta";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Download Queue",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  return json({
    torrents: await torrentsManager.getSerialized()
  });
};

export default function Queue() {
  const {torrents} = useLoaderData();
  const [error, setError] = useState<string | Error>(null);
  let navigate = useNavigate();
   useEffect(() => {
     setInterval(() => {
       navigate(".", { replace: true });
     }, 1000);
   }, []);

   async function remove(torrent: WebTorrent, permaDelete: boolean) {
     try {
       await axios({
         method: 'post',
         url: `/actions/${permaDelete ? 'delete': 'remove'}/${torrent.hash}`,
         data: {}
       });
     } catch(e) {
       setError(e);
     }
   }

   return <div className="container-fluid">
     <div className="d-sm-flex align-items-center justify-content-between mb-4">
       <h1 className="h3 mb-0 text-gray-800">Download Queue</h1>
       <a href="/history" className="d-none d-sm-inline-block btn btn-sm btn-info shadow-sm"><i className="fas fa-download fa-sm text-white-50"></i> Download History</a>
     </div>
     {
         error && <Modal title="Error" onClose={() => {return setError(null)}}>
           {error.toString()}
         </Modal>
     }
     <div className="row">
       {
         torrents.map((result: WebTorrent) => {
           return <WebTorrentComponent torrent={result} onHardDelete={async () => {
             await remove(result, true);
           }} onSoftDelete={async () => {
             await remove(result, false);
           }}/>
         })
       }
       {
           !torrents.length && <>
             <span className="text-center w-100">No torrents are downloading right now</span>
           </>
       }
     </div>
   </div>
}
