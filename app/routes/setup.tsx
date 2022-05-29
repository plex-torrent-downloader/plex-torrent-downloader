import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import {useState} from "react";
import { redirect } from "@remix-run/node";
import fs from '../fs.server';

type LoaderData = {
  settings?: Settings;
};

export const action = async ({request}) => {
  const formData = await request.formData();
  const fileSystemRoot = formData.get('fileSystemRoot');
  try {
    await fs.access(fileSystemRoot);
  } catch(e) {
    throw new Error("FS Location not found!");
  }
  const setObject = {
    fileSystemRoot,
    cacheSearchResults: !!formData.get('cacheSearchResults')
  }
  await db.settings.upsert({
    where: {
      id : 1
    },
    create: setObject,
    update: setObject
  });

  throw redirect('/collections', 302);
};

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await db.settings.findUnique({
    where: {
      id : 1
    }
  });
  return json({
    settings
  });
};

export default function Index() {
  const settings:LoaderData = useLoaderData();
  const [fileSystemRoot, setFileSystemRoot] = useState<string>(settings.settings?.fileSystemRoot ?? '');
  const [cacheSearchResults, setCacheSearchResults] = useState<boolean>(settings.settings?.cacheSearchResults ?? false);
  return <ControlPanel name="Initial Setup" subtext="Please select the location of your content root, for example, the filesystem path to your external HDD.">
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
              <input type="text" name="fileSystemRoot" value={fileSystemRoot} onChange={(e) => setFileSystemRoot(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td>Cache Search Results</td>
            <td>
              <input type="checkbox" name="cacheSearchResults" checked={cacheSearchResults} onChange={(e) => setCacheSearchResults(!cacheSearchResults)} />
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
