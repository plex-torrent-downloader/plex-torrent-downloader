import {useLoaderData, useNavigate} from "@remix-run/react";
import { redirect } from "@remix-run/node";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import torrentsManager from "~/torrents.server";
import SearchPanel from "~/components/SearchPanel";
import {WebTorrent} from "~/contracts/WebTorrentInterface";
import {useEffect} from "react";

type LoaderData = {
  settings?: Settings;
};

function formatSizeUnits(bytes)
{
  if ( ( bytes >> 30 ) & 0x3FF )
    bytes = ( bytes >>> 30 ) + '.' + ( bytes & (3*0x3FF )) + 'GB' ;
  else if ( ( bytes >> 20 ) & 0x3FF )
    bytes = ( bytes >>> 20 ) + '.' + ( bytes & (2*0x3FF ) ) + 'MB' ;
  else if ( ( bytes >> 10 ) & 0x3FF )
    bytes = ( bytes >>> 10 ) + '.' + ( bytes & (0x3FF ) ) + 'KB' ;
  else if ( ( bytes >> 1 ) & 0x3FF )
    bytes = ( bytes >>> 1 ) + 'Bytes' ;
  else
    bytes = bytes + 'Byte' ;
  return bytes ;
}

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await db.settings.findUnique({
    where: {
      id : 1
    }
  });
  if (!settings) {
    throw redirect("/setup", 302);
  }
  throw redirect(torrentsManager.getSerialized().length ? '/queue' : '/search', 302);
};

export default function Index() {
  return null;
}
