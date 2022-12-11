import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import SearchPanel from "~/components/SearchPanel";
import {useEffect, useState} from "react";
import AddTorrentModal from "~/components/AddTorrentModal";
import {Torrent} from "../search.server";
import {db} from "~/db.server";
import searchServer from "~/search.server";
import loadingStyles from '../styles/loading.css';
import {Collections, SearchResults, Settings} from "@prisma/client";
import SearchTorrent from "~/components/SearchTorrent";
import torrentStyles from  '../styles/torrent.css';

export function links() {
  return [
      { rel: "stylesheet", href: loadingStyles },
      { rel: "stylesheet", href: torrentStyles }
  ];
}

export const meta: MetaFunction = ({data}) => {
  return {
    charset: "utf-8",
    title: data?.q ?`Searching ${data.q}` : 'Search',
    viewport: "width=device-width,initial-scale=1",
  };
}

interface LoaderData {
  results: SearchResults[];
  q: string;
  hash: string;
  collections: Collections[];
  settings: Settings;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const hash = url.searchParams.get('hash');
  const results = q ? await searchServer.search(q) : [];
  const collections = await db.collections.findMany();
  const settings = await db.settings.findUnique({where: {id : 1}});
  return json({
    results,
    q,
    hash,
    collections,
    settings
  });
};

export default function Search() {
  const loaderData:LoaderData = useLoaderData();
  const [selection, setSelection] = useState<Torrent>(null);

  function download(e, torrent: Torrent) {
    e.preventDefault();
    setSelection(torrent);
  }

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
    <SearchPanel itemName={loaderData.settings.searchEngine} query={loaderData.q} action="/search">
      <button className="btn btn-xl w-10 btn-success fixed-bottom" onClick={() => useHash('')}>[ + ] Add Infohash</button>
      <div className="col-lg-12">
        <table className="table text-white table-sm">
          <thead>
          {!!loaderData?.results?.length && <tr>
            <th className="text-center">{loaderData.results.length} Search Results</th>
          </tr>}
          </thead>
          <tbody>
          {
              loaderData.results && loaderData.results.map((result: SearchResults) => {
                return <tr>
                  <td>
                    <SearchTorrent torrent={result} handleDownload={() => {setSelection(result)}} />
                  </td>
                </tr>
              })
          }
          </tbody>
        </table>
        {
            !loaderData.results || !loaderData.results.length && <>
              <span className="text-center w-100">No Results to display</span>
            </>
        }
      </div>
    </SearchPanel>
  </>;
}
