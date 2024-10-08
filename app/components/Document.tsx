import {
    Form,
    Links,
    Meta,
    useLoaderData, useLocation, useSearchParams,
} from "@remix-run/react";
import {useState} from "react";

export default function Document({children}) {
    const location = useLocation();
    const loaderData = useLoaderData();
    const [searchParams] = useSearchParams();
    const [expanded, setExpanded] = useState<boolean>(true);
    const [query, setQuery] = useState<string>(searchParams.get('q') || '');
    const currentUrl = location.pathname;

    function getClassName(contains: string):string {
        if (!loaderData?.url) {
            return '';
        }
        return loaderData?.url.includes(contains) ? "nav-item" : "nav-item active";
    }

    if (currentUrl === '/login') {
        return <html lang="en" className="h-full bg-dark">
        <head>
            <Meta />
            <Links />
        </head>
        <body className="bg-gradient-primary">
        {children}
        </body>
        </html>
    }

    return (
        <html lang="en" className="h-full bg-dark">
        <head>
            <Meta />
            <Links />
        </head>
        <body className="sidebar-toggled">
        <div id="wrapper">
            <ul
                className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${expanded ? 'toggled' : ''}`}
                id="accordionSidebar"
            >
                <a
                    className="sidebar-brand d-flex align-items-center justify-content-center"
                    href="/"
                >
                    <div className="sidebar-brand-icon rotate-n-15" title="Plex Torrent Downloader">
                        <i className="fas fa-download" />
                    </div>
                    <div className="sidebar-brand-text mx-3">
                        Plex Torrent Downloader
                    </div>
                </a>
                <hr className="sidebar-divider my-0" />
                {loaderData?.settings ? (
                    <>
                        <li className={getClassName('/queue')}>
                            <a className="nav-link" href="/queue">
                                <i className="fas fa-fw fa-download" />
                                <span>Queue ({loaderData?.torrents?.length || 0})</span>
                            </a>
                        </li>
                        <hr className="sidebar-divider" />

                        <li className={getClassName('/search')}>
                            <a className="nav-link" href="/search">
                                <i className="fas fa-fw fa-search" />
                                <span>Search</span>
                            </a>
                        </li>
                        <hr className="sidebar-divider" />

                        <li className={getClassName('/setup')}>
                            <a className="nav-link" href="/setup">
                                <i className="fas fa-fw fa-cog" />
                                <span>Settings</span>
                            </a>
                        </li>
                        <hr className="sidebar-divider" />

                        <li className={getClassName('/collections')}>
                            <a className="nav-link" href="/collections">
                                <i className="fas fa-fw fa-th-large" />
                                <span>Collections</span>
                            </a>
                        </li>
                        <hr className="sidebar-divider" />
                        <li className={getClassName('/scheduled_downloads')}>
                            <a className="nav-link" href="/scheduled_downloads">
                                <i className="fas fa-fw fa-calendar" />
                                <span>Scheduled Downloads</span>
                            </a>
                        </li>
                    </>
                ) : (
                    <>
                        <li className={getClassName('/setup')}>
                            <a className="nav-link" href="/setup">
                                <i className="fas fa-fw fa-play-circle" />
                                <span>First Time Setup</span>
                            </a>
                        </li>
                        <hr className="sidebar-divider" />
                    </>
                )}
                <hr className="sidebar-divider" />
                <div className="text-center d-none d-md-inline">
                    <button className="rounded-circle border-0" id="sidebarToggle" onClick={e => setExpanded(!expanded)} />
                </div>
            </ul>

            <div id="content-wrapper" className="d-flex flex-column">
                <div id="content">
                    <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                        <button
                            id="sidebarToggleTop"
                            className="btn btn-link d-md-none rounded-circle mr-3"
                            onClick={e => setExpanded(!expanded)}
                        >
                            <i className="fa fa-bars" />
                        </button>
                        <Form className="d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search" method="GET" action="/search">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control bg-light border-0 small"
                                    placeholder={`Search ${loaderData?.settings?.searchEngine}`}
                                    aria-label="Search"
                                    name="q"
                                    aria-describedby="basic-addon2"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                                <div className="input-group-append">
                                    <button className="btn btn-primary">
                                        <i className="fas fa-search fa-sm" />
                                    </button>
                                </div>
                            </div>
                        </Form>
                    </nav>
                    {children}
                </div>
            </div>
        </div>
        <a className="scroll-to-top rounded" href="#page-top">
            <i className="fas fa-angle-up" />
        </a>
        </body>
        </html>
    );
}
