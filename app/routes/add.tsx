import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
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

  webtorrent.add(`magnet:?xt=urn:btih:${formData.hash}`, { path: formData.path }, async (torrent) => {
    await torrentManager.addTorrent(torrent, formData.path);
  });

  return json({success: true});
};
