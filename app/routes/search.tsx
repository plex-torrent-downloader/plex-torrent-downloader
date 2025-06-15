import {Link, useLoaderData, useSearchParams} from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import AddTorrentModal from "~/components/AddTorrentModal";
import { Torrent } from "../search.server";
import { db } from "~/db.server";
import searchServer from "~/search.server";
import { Collections, SearchResults, Settings, RecentSearches } from "@prisma/client";
import SearchTorrent from "~/components/SearchTorrent";
import moment from "moment";
import { Plus } from "lucide-react";

interface LoaderData {
  results: SearchResults[];
  recentSearches: RecentSearches[];
  q: string | null;
  hash: string | null;
  collections: Collections[];
  settings: Settings;
  downloaded: string[];
  searchEngine: string;
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const { settings } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const hash = url.searchParams.get('hash');
  const searchEngine = url.searchParams.get('engine') || settings?.searchEngine || 'The Pirate Bay';
  const results = q ? await searchServer.search(q, searchEngine) : [];
  const collections = await db.collections.findMany();
  const recentSearches: RecentSearches[] = await db.recentSearches.findMany({
    orderBy: { updatedAt: 'desc' },
    skip: 0,
    take: 10
  });
  const downloaded: string[] = (await db.downloaded.findMany({
    select: { hash: true },
    where: {
      NOT: [{
        completedAt: null
      }]
    }
  })).map(r => r.hash.toUpperCase());

  return json({
    results,
    recentSearches,
    q,
    hash,
    collections,
    settings,
    downloaded,
    searchEngine
  });
};

export default function Search() {
  const loaderData = useLoaderData() as unknown as LoaderData;
  const [selection, setSelection] = useState<Torrent | null>(null);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const hash = searchParams.get('hash');

  function useHash(hash: string = '') {
    setSelection({
      name: 'Torrent using infohash',
      seeders: 0,
      leechers: 0,
      hash,
      magnet: null,
      fileSize: 'Unknown',
    });
  }

  useEffect(() => {
    if (hash) {
      useHash(hash);
    }
  }, [hash]);

  return (
      <div className="min-h-screen p-4 space-y-6">
        {selection && (
            <AddTorrentModal
                torrent={selection}
                onClose={() => setSelection(null)}
                collections={loaderData.collections}
                settings={loaderData.settings}
            />
        )}

        <button
            onClick={() => useHash('')}
            className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Add Infohash"
        >
          <Plus className="h-6 w-6" />
        </button>

        <div className="w-full">
          <div className="flex flex-col space-y-2 mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {loaderData.results.length
                  ? `${loaderData.results.length} Search Results`
                  : (q.length ? `No results for "${q}"` : null)}
            </h4>
            <h5 className="text-lg font-medium text-gray-900 dark:text-white">
              Searching {loaderData.searchEngine}
            </h5>
          </div>

          <div className="space-y-4">
            {loaderData.results?.map((result: SearchResults) => (
                <SearchTorrent
                    key={result.hash}
                    torrent={result}
                    handleDownload={() => setSelection(result)}
                    isDownloaded={loaderData.downloaded.includes(result.hash?.toUpperCase())}
                />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <h6 className="text-sm font-medium text-blue-600 dark:text-blue-400">Recent Searches</h6>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {loaderData.recentSearches.map((rs: RecentSearches) => (
                <div
                    key={rs.id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <Link
                        to={`/search?q=${encodeURIComponent(rs.searchTerm)}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {rs.searchTerm}
                    </Link>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {moment(rs.updatedAt).fromNow()}
                    </span>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}
