import { useLoaderData, useNavigate } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { WebTorrent } from "~/contracts/WebTorrentInterface";
import { useEffect, useState } from "react";
import Modal from "~/components/Modal";
import axios from "axios";
import WebTorrentComponent from '../components/WebTorrent';
import { History, Plus } from 'lucide-react';
import AddTorrentModal from "~/components/AddTorrentModal";
import { db } from '~/db.server';

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Download Queue",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const loader: LoaderFunction = async ({ context }) => {
  const { torrents, settings } = context;
  const collections = await db.collections.findMany();
  return json({ torrents, collections, settings });
};

export default function Queue() {
  const { torrents, collections, settings } = useLoaderData();
  const [showTorrentModal, setShowTorrentModal] = useState<boolean>(false);
  const [error, setError] = useState<string | Error>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      navigate(".", { replace: true });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  async function remove(torrent: WebTorrent, permaDelete: boolean) {
    try {
      await axios({
        method: 'post',
        url: `/actions/${permaDelete ? 'delete' : 'remove'}/${torrent.hash}`,
        data: {}
      });
    } catch (e) {
      setError(e);
    }
  }

  return (
      <div className="min-h-screen p-6">
        {showTorrentModal ? <AddTorrentModal torrent={{
          name: 'New Torrent',
          hash: '',
          fileSize: '?',
          seeders: 0,
        }} onClose={() => setShowTorrentModal(false)} collections={collections} settings={settings} /> : null}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Download Queue
          </h1>
          <div>
            <button
                onClick={() => setShowTorrentModal(true)}
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:hover:bg-green-500 dark:focus:ring-offset-gray-800 transition-colors mr-5"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </button>
            <a
                href="/history"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <History className="mr-2 h-4 w-4" />
              Download History
            </a>
          </div>
        </div>

        {/* Error Modal */}
        {error && (
            <Modal
                title="Error"
                onClose={() => setError(null)}
            >
              <div className="text-red-600">
                {error.toString()}
              </div>
            </Modal>
        )}

        {/* Torrents Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {torrents.map((result: WebTorrent) => (
              <WebTorrentComponent
                  key={result.hash}
                  torrent={result}
                  onHardDelete={async () => {
                    await remove(result, true);
                  }}
                  onSoftDelete={async () => {
                    await remove(result, false);
                  }}
              />
          ))}
        </div>

        {/* Empty State */}
        {!torrents.length && (
            <div className="mt-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 dark:text-white">
                  <svg
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Active Downloads</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No torrents are downloading right now
                </p>
                <div className="mt-6">
                  <a
                      href="/search"
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Search for torrents
                  </a>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
