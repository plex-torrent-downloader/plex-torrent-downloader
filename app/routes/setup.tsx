import {useLoaderData} from "@remix-run/react";
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
  const record = await db.settings.upsert({
    where: {
      id : 1
    },
    create: {
      fileSystemRoot
    },
    update: {
      fileSystemRoot
    }
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
  return <ControlPanel name="Initial Setup" subtext="Please select the location of your content root, for example, the filesystem path to your external HDD.">
    <form method="POST">
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
            <td colSpan={2}>
              <input type="submit" value="Update Settings" className="btn btn-primary w-100" />
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  </ControlPanel>
}
