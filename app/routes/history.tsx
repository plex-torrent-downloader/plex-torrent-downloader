import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import {useState} from "react";
import {db} from "~/db.server";
import {Downloaded} from '@prisma/client';
import moment from "moment";
import Modal from "~/components/Modal";
import axios from "axios";

interface LoaderData {
  downloaded: Downloaded[];
}

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
      setAlertMessage("Torrent is now downloading");
    } catch(e) {
      setError(e.toString());
    }
  }

  function getStatus(downloaded: Downloaded): string {
    if (downloaded.deletedAt) {
      return 'Deleted ' + moment(downloaded.deletedAt).fromNow();
    }
    if (downloaded.completedAt) {
      return 'Completed ' + moment(downloaded.completedAt).fromNow();
    }
    return 'Downloading';
  }

  function getRowClass(downloaded: Downloaded): string {
    if (downloaded.deletedAt) {
      return 'table-danger';
    }
    if (downloaded.completedAt) {
      return 'table-success'
    }
    return 'table-warning';
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
            <th>Downloaded</th>
            <th>Actions</th>
          </tr>}
          </thead>
          <tbody>
          {
              downloaded && downloaded.map((result: Downloaded) => {
                return <tr className={getRowClass(result)}>
                  <td>{result.name}</td>
                  <td>{result.hash}</td>
                  <td>{result.pathOnDisk}</td>
                  <td>{getStatus(result)}</td>
                  <td>Downloaded {moment(result.createdAt).fromNow()}</td>
                  <td>
                    {!!result.completedAt && +moment(result.completedAt) < +moment().subtract(1, 'day') && !result.deletedAt && <button className="btn btn-primary" onClick={e => reseed(e, result)}>Re-Seed</button>}
                    {!!result.deletedAt && <button className="btn btn-info" onClick={e => reseed(e, result)}>Restart Download</button>}
                    {!result.deletedAt && !result.completedAt && <button className="btn btn-info" onClick={() => {window.location.href = "/queue"}}>Manage Download</button>}
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
