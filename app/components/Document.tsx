import {
    Links,
    Meta,
    useLoaderData,
} from "@remix-run/react";
import {useState} from "react";

export default function Document({children}) {
    const loaderData = useLoaderData();
    const [expanded, setExpanded] = useState<boolean>(true);

    function getClassName(contains: string):string {
        if (!loaderData?.url) {
            return '';
        }
        return loaderData?.url.includes(contains) ? 'nav-link px-2 text-primary active' : 'nav-link px-2 text-secondary';
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
                        href="index.html"
                    >
                        <div className="sidebar-brand-icon rotate-n-15">
                            <i className="fas fa-laugh-wink" />
                        </div>
                        <div className="sidebar-brand-text mx-3">
                            Plex Torrent Downloader
                        </div>
                    </a>
                    <hr className="sidebar-divider my-0" />
                    {loaderData?.settings ? (
                        <>
                            <li className="nav-item active">
                                <a className="nav-link" href="/queue">
                                    <i className="fas fa-fw fa-download" />
                                    <span>Download Queue ({loaderData?.torrents?.length || 0})</span>
                                </a>
                            </li>
                            <hr className="sidebar-divider" />

                            <li className="nav-item">
                                <a className="nav-link" href="/search">
                                    <i className="fas fa-fw fa-search" />
                                    <span>Search</span>
                                </a>
                            </li>
                            <hr className="sidebar-divider" />

                            <li className="nav-item">
                                <a className="nav-link" href="/setup">
                                    <i className="fas fa-fw fa-cog" />
                                    <span>Settings</span>
                                </a>
                            </li>
                            <hr className="sidebar-divider" />

                            <li className="nav-item">
                                <a className="nav-link" href="/collections">
                                    <i className="fas fa-fw fa-th-large" />
                                    <span>Collections</span>
                                </a>
                            </li>
                            <hr className="sidebar-divider" />
                        </>
                    ) : (
                        <>
                            <li className="nav-item">
                                <a className="nav-link" href="/setup">
                                    <i className="fas fa-fw fa-play-circle" />
                                    <span>First Time Setup</span>
                                </a>
                            </li>
                            <hr className="sidebar-divider" />
                        </>
                    )}

                    <hr className="sidebar-divider d-none d-md-block" />
                    <div className="text-center d-none d-md-inline">
                        <button className="rounded-circle border-0" id="sidebarToggle" onClick={e => setExpanded(!expanded)} />
                    </div>
                </ul>
                <div id="content-wrapper" className="d-flex flex-column">
                    <div id="content">
                        <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
                            {/* Sidebar Toggle (Topbar) */}
                            <button
                                id="sidebarToggleTop"
                                className="btn btn-link d-md-none rounded-circle mr-3"
                                onClick={e => setExpanded(!expanded)}
                            >
                                <i className="fa fa-bars" />
                            </button>
                            {/* Topbar Search */}
                            <form className="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 small"
                                        placeholder="Search for..."
                                        aria-label="Search"
                                        aria-describedby="basic-addon2"
                                    />
                                    <div className="input-group-append">
                                        <button className="btn btn-primary" type="button">
                                            <i className="fas fa-search fa-sm" />
                                        </button>
                                    </div>
                                </div>
                            </form>
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

    return (
        <html lang="en" className="h-full bg-dark">
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
                        {loaderData?.settings ? <>
                            <li><a href="/queue" className={getClassName('queue')}>Download Queue ({loaderData?.torrents?.length || 0})</a></li>
                            <li><a href="/search" className={getClassName('search')}>Search</a></li>
                            <li><a href="/setup" className={getClassName('setup')}>Settings</a></li>
                            <li><a href="/collections" className={getClassName('collections')}>Collections</a></li>
                        </> : <>
                            <li><a href="/setup" className="nav-link px-2 text-secondary">First Time Setup</a></li>
                        </>}
                    </ul>
                </div>
            </div>
        </header>
        {children}
        </body>
        </html>
    );
}
