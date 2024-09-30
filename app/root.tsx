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
import {metaV1} from "@remix-run/v1-meta";

// IMPORTANT TO WORK WITH EXPRESS
if (typeof window !== "undefined") {
  const hydratedPathname = window.location.pathname;
  window.__remixContext.url = hydratedPathname;
}

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: bootstrap }];
};

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Plex Torrent Downloader",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const settings = await db.settings.findUnique({
    where: {
      id : 1
    }
  });
  return json({
    settings,
    url: request.url,
    q,
    torrents: (await torrentsManager.getSerialized())
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
        <div className="alert alert-danger" role="alert" style={{backgroundColor: '#dc3545', color: 'white'}}>
          <h1 className="alert-heading">Application Error</h1>
          <hr style={{borderTop: '1px solid white'}}/>
          <pre className="mb-0">{error.message}</pre>
        </div>
      </Document>
  );
}

