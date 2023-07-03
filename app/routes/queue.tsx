import {useLoaderData, useNavigate} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {useEffect, useState} from "react";
import Modal from "~/components/Modal";
import axios from "axios";
import torrentsManager from '../torrents.server';
import WebTorrentComponent from '../components/WebTorrent';
import styles from  '../styles/torrent.css';
import RequireAuth from "~/middleware/RequireAuth.server";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Download Queue",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  const ft = RequireAuth(async ({ request }) => {
    return json({
      torrents: torrentsManager.getSerialized()
    });
  });
  return ft({request});
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
  return  <div className="container-fluid bg-dark">
    <div className="row">
      <div className="col-lg-12 text-white">
        {
            error && <Modal title="Error" onClose={() => {return setError(null)}}>
              {error.toString()}
            </Modal>
        }
        <div className="col-lg-12">
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
        <div className="col-lg-12">
          <a href="/history" className="small text-white">Download History &gt;</a>
        </div>
      </div>
    </div>
  </div>
}
