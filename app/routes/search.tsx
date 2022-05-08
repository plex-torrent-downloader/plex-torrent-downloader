import {useLoaderData} from "@remix-run/react";
import { redirect } from "@remix-run/node";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import {tpb} from '../tpb.server';
import SearchPanel from "~/components/SearchPanel";

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
  return json({
    results,
    q
  });
};

export default function Search() {
  const {results, q} = useLoaderData();
  return <SearchPanel itemName="torrents" query={q} action="/search">
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
            results && results.map(result => {
              return <tr>
                <td>{result.name}</td>
                <td>{result.seeders}</td>
                <td>{result.fileSize}</td>
                <td>
                    <button className="btn btn-primary">Download</button>
                </td>
              </tr>
            })
          }
          {
              !results && <tr>
                  <td colSpan={3}>
                    <h5 className="text-center">No Results Available</h5>
                  </td>
                </tr>
          }
        </tbody>
      </table>
    </div>
  </SearchPanel>
}
