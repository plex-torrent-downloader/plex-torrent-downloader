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
import {json, LoaderFunction} from "@remix-run/node";
import Document from "~/components/Document";
import styles from "~/styles/tailwind.css";
import QueueProvider from "~/contexts/QueueContext";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

if (typeof window !== "undefined") {
  const hydratedPathname = window.location.pathname;
  window.__remixContext.url = hydratedPathname;
}

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Plex Torrent Downloader",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const loader: LoaderFunction = async ({ request, context }) => {
  const { settings, torrents } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  return json({
    settings,
    url: request.url,
    q,
    torrents
  });
};

export default function App() {
  return <QueueProvider>
    <Document>
      <Outlet />
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
    </Document>
  </QueueProvider>;
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document>
      <h1>App Error</h1>
      <pre>{error.message}</pre>
    </Document>
  );
}

