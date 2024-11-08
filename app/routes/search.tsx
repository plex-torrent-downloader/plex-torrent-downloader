import {useLoaderData, useSearchParams} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import SearchPanel from "~/components/SearchPanel";
import {useEffect, useState} from "react";
import AddTorrentModal from "~/components/AddTorrentModal";
import {Torrent} from "../search.server";
import {db} from "~/db.server";
import searchServer from "~/search.server";
import loadingStyles from '../styles/loading.css';
import {Collections, SearchResults, Settings, RecentSearches} from "@prisma/client";
import SearchTorrent from "~/components/SearchTorrent";
import torrentStyles from  '../styles/torrent.css';
import moment from "moment";

export function links() {
  return [
      { rel: "stylesheet", href: loadingStyles },
      { rel: "stylesheet", href: torrentStyles }
  ];
}

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

export const loader: LoaderFunction = async ({request, context}) => {
  const {settings} = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const hash = url.searchParams.get('hash');
  const results = q ? await searchServer.search(q) : [];
  const collections = await db.collections.findMany();
  const recentSearches: RecentSearches[] = await db.recentSearches.findMany({
    orderBy: {updatedAt: 'desc'},
    skip: 0,
    take: 10
  });
  const downloaded = (await db.downloaded.findMany({
    select: {hash: true},
    where: {
      NOT: [{
        completedAt: null
      }]
    }
  })).map(r => r.hash);
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
  const loaderData = useLoaderData();
  const [selection, setSelection] = useState<Torrent>(null);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const hash = searchParams.get('hash');

  function useHash(hash: string = ''){
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

  return <>
    {!!selection && <AddTorrentModal torrent={selection} onClose={() => setSelection(null)} collections={loaderData.collections} settings={loaderData.settings} />}
    <SearchPanel itemName={loaderData.settings.searchEngine} query={loaderData.q} action="/search">
      <button className="btn btn-xl w-10 btn-success fixed-bottom" onClick={() => useHash('')}>[ + ] Add Infohash</button>
      <div className="col-lg-12">
        <h4 className="m-2">{loaderData.results.length ? `${loaderData.results.length} Search Results` : `No results for ${q}`}</h4>
        {
            loaderData.results && loaderData.results.map((result: SearchResults) => {
              return <SearchTorrent torrent={result} handleDownload={() => {setSelection(result)}} isDownloaded={loaderData.downloaded.includes(result.hash)} />
            })
        }

        <br />
        <br />
      </div>
    </SearchPanel>
    <div className="container-fluid mb-5">
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Recent Searches</h6>
        </div>
        <div className="card-body">
          {loaderData.recentSearches.map((rs: RecentSearches) => <div className="col-lg-6 offset-2">
            <a href={`/search?q=${encodeURIComponent(rs.searchTerm)}`}>{rs.searchTerm}</a>
            <span className="text-muted"> | {moment(rs.updatedAt).fromNow()}</span><br />
          </div>)}
        </div>
      </div>
    </div>
  </>;
}
