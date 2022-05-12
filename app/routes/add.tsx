import {useLoaderData} from "@remix-run/react";
import { redirect } from "@remix-run/node";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import webtorrent from '../webtorrent.server';
import fs from '../fs.server';
import torrentManager from "~/torrents.server";

type LoaderData = {
  settings?: Settings;
};

export const action = async ({request}) => {
  const formData = await request.json();

  if (!formData.hash) {
    throw new Error("Invalid Hash provided.");
  }

  if (!formData.path) {
    throw new Error("Invalid Path");
  }

  try {
    await fs.access(formData.path);
  } catch(e) {
    throw new Error("Please check the download path. The location cannot be found.");
  }

  webtorrent.add(`magnet:?xt=urn:btih:${formData.hash}`, { path: formData.path }, function (torrent) {
    console.log('torrent', torrent);
    torrentManager.addTorrent(torrent);
  })

  return json({success: true});
};

export default function Index() {
  const settings:LoaderData = useLoaderData();
  return <ControlPanel name="Add Route" subtext="Please come back later">
    <h4>Please come back later</h4>
  </ControlPanel>
}
