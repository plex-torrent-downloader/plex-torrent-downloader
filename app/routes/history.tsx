import {Link, useLoaderData, useNavigate} from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { useState } from "react";
import { db } from "~/db.server";
import { Downloaded } from '@prisma/client';
import moment from "moment";
import Modal from "~/components/Modal";
import axios from "axios";
import DownloadHistoryTorrrent from "~/components/DownloadHistoryTorrrent";
import { getStatus } from "~/components/DownloadHistoryTorrrent";
import { Download, AlertCircle, InboxIcon } from 'lucide-react';

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

export const loader: LoaderFunction = async () => {
  const downloaded = await db.downloaded.findMany({
    orderBy: [{ id: 'desc' }],
  });
  return json({
    downloaded
  });
};

export default function History() {
  const { downloaded } = useLoaderData() as unknown as LoaderData;
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    } catch (e) {
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

  async function deleteHistoryItem(result: Downloaded) {
    try {
      await axios.delete('/history/' + (result.id));
      navigate(".", { replace: true });
    } catch (e) {
      console.error(e);
      setError("Sorry, this item could not be deleted from history. Please try again later.");
    }
  }

  return (
      <div className="min-h-screen p-6">
        {/* Modals */}
        {alertMessage && (
            <Modal
                title="Notice"
                onClose={() => setAlertMessage(null)}
                buttons={[
                  {
                    label: "Okay",
                    action: () => setAlertMessage(null),
                    variant: "primary"
                  }
                ]}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <p className="dark:text-white text-gray-600">{alertMessage}</p>
              </div>
            </Modal>
        )}

        {error && (
            <Modal
                title="Error"
                onClose={() => setError(null)}
                buttons={[
                  {
                    label: "Close",
                    action: () => setError(null),
                    variant: "primary"
                  }
                ]}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-600">{error}</p>
              </div>
            </Modal>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-4 sm:mb-0">
            Download History
          </h1>
          <Link
              to="/queue"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Queue
          </Link>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {downloaded?.map((result: Downloaded) => (
              <DownloadHistoryTorrrent
                  key={result.id}
                  torrent={result}
                  actions={[
                    {
                      name: getStatus(result) === 'Completed' ? 'Re-Seed' : 'Restart Download',
                      action: () => reseed(result),
                      className: 'w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    },
                    {
                      name: 'Delete History Item',
                      action: () => deleteHistoryItem(result),
                      className: 'w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }
                  ]}
              />
          ))}
        </div>

        {/* Empty State */}
        {(!downloaded || !downloaded.length) && (
            <div className="mt-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="text-center">
                <InboxIcon className="mx-auto h-12 w-12 dark:text-white text-gray-400" />
                <h3 className="mt-2 text-sm font-medium dark:text-white text-gray-900">No download history</h3>
                <p className="mt-1 text-sm dark:text-white text-gray-500">
                  Start by downloading some torrents
                </p>
                <div className="mt-6">
                  <Link
                      to="/search"
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Start Downloading
                  </Link>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
