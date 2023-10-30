import {useLoaderData} from "@remix-run/react";
import {DataFunctionArgs, json, LoaderFunction, MetaFunction} from "@remix-run/node";
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
import RequireAuth from "~/middleware/RequireAuth.server";
import {metaV1} from "@remix-run/v1-meta";

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

export const loader: LoaderFunction = async (input) => {
  const ft = RequireAuth(async ({request, settings}) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const hash = url.searchParams.get('hash');
    const results = q ? await searchServer.search(q) : [];
    const collections = await db.collections.findMany();
    let recentSearches: RecentSearches[] = [];
    if (!q) {
      recentSearches = await db.recentSearches.findMany({
        orderBy: {updatedAt: 'desc'},
        skip: 0,
        take: 10
      });
    }
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
  });
  return ft(input);
};

export default function Search() {
  const loaderData = useLoaderData();
  const [selection, setSelection] = useState<Torrent>(null);

  function useHash(hash: string = ''){
    setSelection({
      name: 'Torrent using infohash',
      seeders: 0,
      leechers: 0,
      hash,
      fileSize: 'Unknown',
    });
  }

  useEffect(() => {
    if (loaderData.hash) {
      useHash(loaderData.hash);
    }
  }, [loaderData.hash]);

  return <>
    {!!selection && <AddTorrentModal torrent={selection} onClose={() => setSelection(null)} collections={loaderData.collections} settings={loaderData.settings} />}
    {loaderData.results.length ? <SearchPanel itemName={loaderData.settings.searchEngine} query={loaderData.q} action="/search">
      <button className="btn btn-xl w-10 btn-success fixed-bottom" onClick={() => useHash('')}>[ + ] Add Infohash</button>
      <div className="col-lg-12">
        <h4 className="m-2">{loaderData.results.length} Search Results</h4>
        {
            loaderData.results && loaderData.results.map((result: SearchResults) => {
              return <SearchTorrent torrent={result} handleDownload={() => {setSelection(result)}} isDownloaded={loaderData.downloaded.includes(result.hash)} />
            })
        }

        <br />
        <br />
      </div>
    </SearchPanel> : <></>}
    {
        !loaderData.results || !loaderData.results.length && <>
          {loaderData.recentSearches.length && <div className="container-fluid">
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
          </div> }
        </>
    }
  </>;
}
