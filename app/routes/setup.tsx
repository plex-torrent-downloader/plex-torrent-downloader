import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import {useState} from "react";
import { redirect } from "@remix-run/node";
import fs from '../fs.server';
import Bcrypt from '../bcrypt.server';
import RequireAuth from "~/middleware/RequireAuth.server";

type LoaderData = {
  settings?: Settings;
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Setup",
  viewport: "width=device-width,initial-scale=1",
});

export const action = async ({request}) => {
  const formData = await request.formData();
  const fileSystemRoot = formData.get('fileSystemRoot');
  try {
    await fs.access(fileSystemRoot);
  } catch(e) {
    throw new Error("FS Location not found!");
  }
  const setObject = {
    id: 1,
    fileSystemRoot,
    cacheSearchResults: !!formData.get('cacheSearchResults'),
    saveDownloadHistory: !!formData.get('saveDownloadHistory'),
    searchEngine: formData.get('searchEngine'),
    password: formData.get('password') === '' ? null : (await Bcrypt.hashPassword(formData.get('password')))
  }
  const settings = await db.settings.upsert({
    where: {
      id : 1
    },
    create: setObject,
    update: setObject
  });

  if (!(await db.collections.count())) {
    throw redirect('/collections', 302);
  }

  return json({settings});
};

export const loader: LoaderFunction = async ({ request }) => {
  const ft = RequireAuth(async ({settings}) => {
    return json({settings});
  });
  return ft({request});
};

export default function Index() {
  const settings:LoaderData = useLoaderData();
  const [fileSystemRoot, setFileSystemRoot] = useState<string>(settings.settings?.fileSystemRoot ?? '');
  const [cacheSearchResults, setCacheSearchResults] = useState<boolean>(settings.settings?.cacheSearchResults ?? true);
  const [saveDownloadHistory, setSaveDownloadHistory] = useState<boolean>(settings.settings?.saveDownloadHistory ?? true);
  const [searchEngine, setSearchEngine] = useState<string>(settings.settings?.searchEngine ?? '');
  const [password, setPassword] = useState<string>(settings.settings?.password ?? '');
  return <ControlPanel name={settings?.settings ? "Settings" : "Initial Setup"} subtext="Please select the location of your content root, for example, the filesystem path to your external HDD.">
    {+new Date(settings.settings?.updatedAt) > (+ new Date) - 1000 && <div className="alert alert-success" role="alert">
      Settings Updated!
    </div>}
    <Form method="post">
      <table className="table text-white">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Plex Content Root</td>
            <td>
              <input type="text" className="form-control" name="fileSystemRoot" value={fileSystemRoot} onChange={(e) => setFileSystemRoot(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td>Search Engine</td>
            <td>
              <select name="searchEngine" className="form-control" value={searchEngine} onChange={(e) => setSearchEngine(e.target.value)}>
                <option>1377x.to</option>
                <option>nyaa.si</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>Cache Search Results</td>
            <td>
              <input type="checkbox" name="cacheSearchResults" checked={cacheSearchResults} onChange={(e) => setCacheSearchResults(!cacheSearchResults)} />
            </td>
          </tr>
          <tr>
            <td>Save Download History</td>
            <td>
              <input type="checkbox" name="saveDownloadHistory" checked={saveDownloadHistory} onChange={(e) => setSaveDownloadHistory(!saveDownloadHistory)} />
            </td>
          </tr>
          <tr>
            <td>Set a password (optional but recommended)</td>
            <td>
              <input type="password" className="form-control" value={password} name="password" onChange={(e) => setPassword(e.target.value)} />
            </td>
          </tr>
          {settings.settings && <tr>
            <td>Hard Reset</td>
            <td>
              <a href="/reset" className="text-danger">Hard Reset</a>
            </td>
          </tr>}
          <tr>
            <td colSpan={2}>
              <input type="submit" value="Update Settings" className="btn btn-primary w-100" />
            </td>
          </tr>
        </tbody>
      </table>
    </Form>
  </ControlPanel>
}
