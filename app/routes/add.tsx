import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import fs from '../fs.server';
import torrentManager from "~/torrents.server";

type LoaderData = {
  settings?: Settings;
};

export const action = async ({request, context}) => {
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

  if (formData?.magnet) {
    await torrentManager.addMagnet(formData.magnet, formData.path);
  } else {
    await torrentManager.addInfohash(formData.hash, formData.path);
  }

  return json({success: true});
}
