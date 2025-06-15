import type {
  LinksFunction,
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
import { SearchEngine } from "~/search.server";

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
    torrents,
    searchEngines: SearchEngine
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
  console.error(error);
  return (
      <Document>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-2xl">
            <div className="border border-red-500/50 dark:border-red-400/50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3">
                <svg
                    className="h-6 w-6 text-red-500 dark:text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Application Error
                </h2>
              </div>

              <div className="mt-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  An unexpected error has occurred. Please try again later.
                </p>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
                  <code className="text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                    {error.message}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Document>
  );
}

