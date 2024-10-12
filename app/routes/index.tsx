import {redirect} from "@remix-run/node";
import {LoaderFunction} from "@remix-run/node";
import {db} from '../db.server';
import torrentsManager from "~/torrents.server";
import {Torrent} from "~/search.server";
import {WebTorrent} from "~/contracts/WebTorrentInterface";

export const loader: LoaderFunction = async ({ context }) => {
  const { settings, torrents } = context;
  if (!settings) {
    throw redirect("/setup", 302);
  }
  throw redirect((torrents as WebTorrent[]).length ? '/queue' : '/search', 302);
};

export default function Index() {
  return null;
}
