import type {
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  LiveReload,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import torrentsManager from "~/torrents.server";
import bootstrap from "./styles/bootstrap.css";
import {json, LoaderFunction} from "@remix-run/node";
import {db} from "~/db.server";
import Document from "~/components/Document";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: bootstrap }];
};

export const meta: MetaFunction = ({data, parentsData}) => {
    return {
      charset: "utf-8",
      title: "Plex Torrent Downloader",
      viewport: "width=device-width,initial-scale=1",
    };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const settingsExist = await db.settings.count({
    where: {
      id : 1
    }
  });
  return json({
    settingsExist,
    url: request.url,
    q,
    torrents: torrentsManager.getSerialized()
  });
};

export default function App() {
  return <Document>
    <Outlet />
    <ScrollRestoration />
    <Scripts />
    <LiveReload />
  </Document>;
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
      <Document>
        <div className="error-container">
          <h1>App Error</h1>
          <pre>{error.message}</pre>
        </div>
      </Document>
  );
}
