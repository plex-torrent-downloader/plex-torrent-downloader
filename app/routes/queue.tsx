import {useLoaderData, useNavigate} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {useEffect, useState} from "react";
import Modal from "~/components/Modal";
import axios from "axios";
import torrentsManager from '../torrents.server';

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Download Queue",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  return json({
    torrents: torrentsManager.getSerialized()
  });
};

export default function Queue() {
  const {torrents} = useLoaderData();
  const [confirmDelete, setConfirmDelete] = useState<WebTorrent>(null);
  const [error, setError] = useState<string | Error>(null);
  let navigate = useNavigate();
   useEffect(() => {
     setInterval(() => {
       navigate(".", { replace: true });
     }, 1000);
   }, []);

   async function remove(permaDelete: boolean) {
     try {
       await axios({
         method: 'post',
         url: `/actions/${permaDelete ? 'delete': 'remove'}/${confirmDelete.hash}`,
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
        {
            confirmDelete && <Modal title="Are you sure you want to delete this torrent?" onClose={() => setConfirmDelete(null)} buttons={
              [
                {
                  label: 'Stop Downloading',
                  action: async () => {
                    await remove(false);
                    setConfirmDelete(null);
                  },
                  class: 'btn btn-primary'
                },
                {
                  label: 'Delete',
                  action: async () => {
                    await remove(true);
                    setConfirmDelete(null);
                  },
                  class: 'btn btn-danger'
                }
              ]}>
              Please confirm you want to stop downloading this torrent or delete it.
            </Modal>
        }
        <div className="col-lg-12">
          <table className="table text-white">
            <thead>
            {!!torrents.length && <tr>
              <th>Name</th>
              <th>Progress</th>
              <th>Download Speed</th>
              <th>Upload Speed</th>
              <th>Path</th>
              <th>Peers</th>
            </tr>}
            </thead>
            <tbody>
            {
              torrents.map((result: WebTorrent) => {
                return <tr className={result.class}>
                  <td>
                    {result.name}
                    <br />
                    <small>
                      <a className="text-muted" href={`/search?hash=${result.hash}`}>{result.hash.substr(0, 5)}...</a>
                    </small>
                  </td>
                  <td>{result.progress}</td>
                  <td>{formatSizeUnits(result.downloadSpeed)}</td>
                  <td>{formatSizeUnits(result.uploadSpeed)}</td>
                  <td>{result.path}</td>
                  <td>{result.numPeers}</td>
                  <td>
                    <button className="btn btn-danger" onClick={e => setConfirmDelete(result)}>{result.done ? 'Delete' : 'Cancel'}</button>
                  </td>
                </tr>
              })
            }
            </tbody>
          </table>
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
