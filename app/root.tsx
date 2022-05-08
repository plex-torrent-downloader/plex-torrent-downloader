import type {
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration, useLoaderData,
} from "@remix-run/react";

import bootstrap from "./styles/bootstrap.css";
import {json, LoaderFunction, redirect} from "@remix-run/node";
import {db} from "~/db.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: bootstrap }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Plex Torrent Downloader",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ request }) => {
  const settingsExist = await db.settings.count({
    where: {
      id : 1
    }
  });
  return json({
    settingsExist
  });
};

export default function App() {
  const {settingsExist} = useLoaderData();
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <header className="p-3 bg-dark text-white">
          <div className="container">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
              <a href="/" className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
                Plex Torrent Downloader
              </a>

              <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
                {settingsExist ? <>
                    <li><a href="/search" className="nav-link px-2 text-secondary">Search</a></li>
                    <li><a href="/setup" className="nav-link px-2 text-secondary">Settings</a></li>
                    <li><a href="/collections" className="nav-link px-2 text-secondary">Collections</a></li>
                  </> : <>
                    <li><a href="/setup" className="nav-link px-2 text-secondary">First Time Setup</a></li>
                </>}
              </ul>

              <form className="col-12 col-lg-auto mb-3 mb-lg-0 me-lg-3">
                <input type="search" className="form-control form-control-dark" placeholder="Search..."
                       aria-label="Search" />
              </form>

              <div className="text-end">
                <button type="button" className="btn btn-outline-light me-2">Login</button>
                <button type="button" className="btn btn-warning">Sign-up</button>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
