import {redirect} from "@remix-run/node";
import {LoaderFunction} from "@remix-run/node";
import {db} from '../db.server';
import torrentsManager from "~/torrents.server";

export const loader: LoaderFunction = async ({ request }) => {
  const settings = await db.settings.findUnique({
    where: {
      id : 1
    }
  });
  if (!settings) {
    throw redirect("/setup", 302);
  }
  throw redirect((await torrentsManager.getSerialized()).length ? '/queue' : '/search', 302);
};

export default function Index() {
  return null;
}
