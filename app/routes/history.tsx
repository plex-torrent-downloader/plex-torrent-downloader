import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {useState} from "react";
import {db} from "~/db.server";
import {Downloaded} from '@prisma/client';
import moment from "moment";
import Modal from "~/components/Modal";
import axios from "axios";

interface LoaderData {
  downloaded: Downloaded[];
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Download History",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  const downloaded = await db.downloaded.findMany({
    orderBy: [{id: 'desc'}],
    take: 50
  });
  return json({
    downloaded
  });
};

export default function History() {
  const {downloaded} = useLoaderData<LoaderData>();
  const [alertMessage, setAlertMessage] = useState<string>(null);
  const [error, setError] = useState<string>(null);

  async function reseed(e, torrent: Downloaded) {
    e.preventDefault();
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

  function getStatus(downloaded: Downloaded): string {
    if (downloaded.completedAt && downloaded.deletedAt) {
      if (downloaded.completedAt > downloaded.deletedAt) {
        return 'completed';
      }
      if (downloaded.completedAt < downloaded.deletedAt) {
        return 'deleted';
      }
    }
    if (downloaded.completedAt) {
      return 'completed';
    }
    if (downloaded.deletedAt) {
      return 'deleted';
    }
    return 'downloading';
  }

  function getRowClass(downloaded: Downloaded): string {
    switch(getStatus(downloaded)) {
      case 'completed':
        return 'table-success';
      case 'deleted':
        return 'table-danger';
      case 'downloading':
      default:
        return 'table-warning';
    }
  }

  return <>
    {alertMessage && <Modal title="Alert" onClose={() => setAlertMessage(null)}>{alertMessage}</Modal>}
    {error && <Modal title="Error" onClose={()=> setError(null)}>{error}</Modal>}
    <div className="container-fluid bg-dark text-white">
      <div className="col-lg-12">
        <h5>Download History</h5>
        <table className="table text-white table-sm">
          <thead>
          {!!downloaded.length && <tr>
            <th>Name</th>
            <th>Hash</th>
            <th>Path on Disk</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>}
          </thead>
          <tbody>
          {
              downloaded && downloaded.map((result: Downloaded) => {
                return <tr className={getRowClass(result)}>
                  <td>{result.name}</td>
                  <td>
                    <small>
                      <a className="text-muted" href={`/search?hash=${result.hash}`}>{result.hash.substr(0, 5)}...</a>
                    </small>
                  </td>
                  <td>{result.pathOnDisk}</td>
                  <td>{getTimestampStatus(result)}</td>
                  <td>Created {moment(result.createdAt).fromNow()}</td>
                  <td>
                    {getStatus(result) === 'completed' && <button className="btn btn-primary" onClick={e => reseed(e, result)}>Re-Seed</button>}
                    {getStatus(result) === 'deleted' && <button className="btn btn-success" onClick={e => reseed(e, result)}>Restart Download</button>}
                  </td>
                </tr>
              })
          }
          </tbody>
        </table>
        {
            !downloaded || !downloaded.length && <span className="text-center w-100">No Results to display</span>
        }
      </div>
    </div>
  </>
}
