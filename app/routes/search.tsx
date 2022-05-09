import {useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {tpb} from '../tpb.server';
import SearchPanel from "~/components/SearchPanel";
import {useState} from "react";
import AddTorrentModal from "~/components/AddTorrentModal";
import {Torrent} from "../tpb.server";
import {db} from "~/db.server";

type LoaderData = {
  settings?: Settings;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  if (!q || q === '') {
    return json({results: null});
  }
  const results = await tpb(q);
  const collections = await db.collections.findMany();
  const settings = await db.settings.findUnique({where: {id : 1}});
  return json({
    results,
    q,
    collections,
    settings
  });
};

export default function Search() {
  const {results, q} = useLoaderData();
  const [selection, setSelection] = useState<Torrent>(null);

  function download(e, torrent: Torrent) {
    e.preventDefault();
    setSelection(torrent);
  }
  return <>
    {!!selection && <AddTorrentModal torrent={selection} onClose={() => setSelection(null)} />}
    <SearchPanel itemName="torrents" query={q} action="/search">
      <div className="col-lg-12">
        <table className="table text-white">
          <thead>
          <tr>
            <th>Name</th>
            <th style={{width: '25px'}}>Seeders</th>
            <th style={{width: '25px'}}>Size</th>
            <th style={{width: '30px'}}>Download</th>
          </tr>
          </thead>
          <tbody>
          {
              results && results.map((result: Torrent) => {
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
          {
              !results && <tr>
                <td colSpan={4}>
                  <h5 className="text-center">No Results Available</h5>
                </td>
              </tr>
          }
          </tbody>
        </table>
      </div>
    </SearchPanel>
  </>;
}
