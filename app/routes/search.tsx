import { useLoaderData, useSearchParams } from "@remix-run/react";
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

// Change the meta export to return an object instead of an array
export function meta(args) {
  return {
    charset: "utf-8",
    title: "Search Results",
    viewport: "width=device-width,initial-scale=1",
  };
}

interface LoaderData {
  results: SearchResults[];
  recentSearches: RecentSearches[];
  q: string;
  hash: string;
  collections: Collections[];
  settings: Settings;
  downloaded: string[];
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const { settings } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const hash = url.searchParams.get('hash');
  const results = q ? await searchServer.search(q) : [];
  const collections = await db.collections.findMany();
  const recentSearches: RecentSearches[] = await db.recentSearches.findMany({
    orderBy: { updatedAt: 'desc' },
    skip: 0,
    take: 10
  });
  const downloaded:string[] = (await db.downloaded.findMany({
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
    downloaded
  });
};

export default function Search() {
  const loaderData = useLoaderData<LoaderData>();
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
            className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Add Infohash"
        >
          <Plus className="h-6 w-6" />
        </button>

        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {loaderData.results.length
                  ? `${loaderData.results.length} Search Results`
                  : `No results for "${q}"`}
            </h4>
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

        {/* Recent Searches Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h6 className="text-sm font-medium text-blue-600">Recent Searches</h6>
          </div>
          <div className="divide-y divide-gray-100">
            {loaderData.recentSearches.map((rs: RecentSearches) => (
                <div key={rs.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <a
                        href={`/search?q=${encodeURIComponent(rs.searchTerm)}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {rs.searchTerm}
                    </a>
                    <span className="text-sm text-gray-500">
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
