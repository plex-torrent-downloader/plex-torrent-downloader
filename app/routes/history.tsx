import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {useState} from "react";
import {db} from "~/db.server";
import {Downloaded} from '@prisma/client';
import moment from "moment";
import Modal from "~/components/Modal";
import axios from "axios";
import DownloadHistoryTorrrent from "~/components/DownloadHistoryTorrrent";
import torrentStyles from  '../styles/torrent.css';
import {getStatus} from "~/components/DownloadHistoryTorrrent";
import RequireAuth from "~/middleware/RequireAuth.server";
import torrentsManager from "~/torrents.server";
import {metaV1} from "@remix-run/v1-meta";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import WebTorrentComponent from "~/components/WebTorrent";

export function links() {
  return [
    { rel: "stylesheet", href: torrentStyles }
  ];
}

interface LoaderData {
  downloaded: Downloaded[];
}

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Download History",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const ft = RequireAuth(async ({ request }) => {
    const downloaded = await db.downloaded.findMany({
      orderBy: [{id: 'desc'}],
      take: 50
    });
    return json({
      downloaded
    });
  });
  return ft({request});
};



export default function History() {
  const {downloaded} = useLoaderData();
  const [alertMessage, setAlertMessage] = useState<string>(null);
  const [error, setError] = useState<string>(null);

  async function reseed(torrent: Downloaded) {
    try {
      await axios({
        method: 'POST',
        url: '/add',
        data: {
          hash: torrent.hash,
          path: torrent.pathOnDisk
        }
      });
      torrent.completedAt = null;
      torrent.deletedAt = null;
      setAlertMessage("The torrent is queued to download or reseed. It may take some time before the torrent shows up in your download manager.");
    } catch(e) {
      setError(e.toString());
    }
  }

  function getTimestampStatus(downloaded: Downloaded): string {
    if (downloaded.deletedAt) {
      return 'Deleted ' + moment(downloaded.deletedAt).fromNow();
    }
    if (downloaded.completedAt) {
      return 'Completed ' + moment(downloaded.completedAt).fromNow();
    }
    return 'Downloading';
  }

  return <div className="container-fluid">
    {alertMessage && <Modal title="Alert" onClose={() => setAlertMessage(null)}>{alertMessage}</Modal>}
    {error && <Modal title="Error" onClose={()=> setError(null)}>{error}</Modal>}
    <div className="d-sm-flex align-items-center justify-content-between mb-4">
      <h1 className="h3 mb-0 text-gray-800">Download History</h1>
      <a href="/queue" className="d-none d-sm-inline-block btn btn-sm btn-info shadow-sm"><i className="fas fa-download fa-sm text-white-50"></i> Download Queue</a>
    </div>
    {
        error && <Modal title="Error" onClose={() => {return setError(null)}}>
          {error.toString()}
        </Modal>
    }
    <div className="row">
      {
          downloaded && downloaded.map((result: Downloaded) => {
            return <DownloadHistoryTorrrent torrent={result} actions={[
              {name: (getStatus(result) === 'Completed' ? 'Re-Seed' : 'Restart Download'), action() {reseed(result)}, btnClass: ' btn btn-xl w-100 btn-primary'},
              {name: 'Delete History Item', action() {alert("Sorry, try again later")}, btnClass: ' btn btn-xl w-100 btn-danger'}
            ]}/>;
          })
      }
      {
          !downloaded || !downloaded.length && <span className="text-center w-100">No Results to display</span>
      }
    </div>
  </div>
}
