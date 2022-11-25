import {
    Links,
    Meta,
    useLoaderData,
} from "@remix-run/react";

export default function Document({children}) {
    const loaderData = useLoaderData();

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
