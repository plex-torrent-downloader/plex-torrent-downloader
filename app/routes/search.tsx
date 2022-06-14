import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import SearchPanel from "~/components/SearchPanel";
import {useEffect, useState} from "react";
import AddTorrentModal from "~/components/AddTorrentModal";
import {Torrent} from "../tpb.server";
import {db} from "~/db.server";
import searchServer from "~/search.server";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Search",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const hash = url.searchParams.get('hash');
  const results = q && q.length ? await searchServer.search(q) : [];
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
  const loaderData = useLoaderData();
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
    <SearchPanel itemName="torrents" query={loaderData.q} action="/search">
      <button className="btn btn-xl w-10 btn-success fixed-bottom" onClick={useHash}>[ + ] Add Infohash</button>
      <div className="col-lg-12">
        <table className="table text-white table-sm">
          <thead>
          {!!loaderData?.results?.length && <tr>
            <th>Name</th>
            <th style={{width: '25px'}}>Seeders</th>
            <th style={{width: '25px'}}>Size</th>
            <th style={{width: '30px'}}>Download</th>
          </tr>}
          </thead>
          <tbody>
          {
              loaderData.results && loaderData.results.map((result: Torrent) => {
                return <tr>
                  <td>{result.name}</td>
                  <td>{result.seeders}</td>
                  <td>{result.fileSize}</td>
                  <td>
                    <button className="btn btn-primary" onClick={e => download(e, result)}>Download</button>
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
