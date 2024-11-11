import React, {useState, useEffect} from 'react';
import {Form, Links, Meta, useLoaderData, useLocation, useSearchParams} from '@remix-run/react';
import {Menu, X, ChevronUp, Download, Search, Settings, Grid, Calendar, PlayCircle, History} from 'lucide-react';

export default function Document({children}) {
    const location = useLocation();
    const loaderData = useLoaderData();
    const [searchParams] = useSearchParams();
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const currentUrl = location.pathname;

    // Check for mobile viewport on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // 1024px is Tailwind's 'lg' breakpoint
            setSidebarOpen(window.innerWidth >= 1024); // Open by default on desktop
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isActive = (path) => {
        if (!loaderData?.url) return false;
        return !loaderData.url.includes(path);
    };

    if (currentUrl === '/login') {
        return (
            <html lang="en" className="h-full">
            <head>
                <Meta/>
                <Links/>
            </head>
            <body className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
            {children}
            </body>
            </html>
        );
    }

    const navItems = loaderData?.settings ? [
        {path: '/queue', icon: Download, label: `Queue (${loaderData?.torrents?.length || 0})`},
        {path: '/search', icon: Search, label: 'Search'},
        {path: '/history', icon: History, label: 'History'},
        {path: '/setup', icon: Settings, label: 'Settings'},
        {path: '/collections', icon: Grid, label: 'Collections'},
        {path: '/scheduled_downloads', icon: Calendar, label: 'Scheduled Downloads'},
    ] : [
        {path: '/setup', icon: PlayCircle, label: 'First Time Setup'},
    ];

    return (
        <html lang="en" className="h-full">
        <head>
            <Meta/>
            <Links/>
        </head>
        <body className="h-full bg-gray-50">
        <div className="min-h-screen flex">
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-gradient-to-b from-blue-600 to-blue-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } ${!isMobile ? 'lg:relative' : ''}`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-blue-500/30">
                    <a href="/" className="flex items-center space-x-3 text-white">
                        <Download className="h-8 w-8 rotate-[-15deg]"/>
                        <span className="text-lg font-semibold">Plex Downloader</span>
                    </a>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white hover:text-gray-200 focus:outline-none"
                    >
                        <X className="h-6 w-6"/>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 py-4">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <a
                                key={item.path}
                                href={item.path}
                                className={`flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                    isActive(item.path)
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-100 hover:bg-white/10'
                                }`}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0"/>
                                <span className="truncate">{item.label}</span>
                            </a>
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main content wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-40 bg-white shadow">
                    <div className="flex h-16 items-center gap-4 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
                        >
                            <Menu className="h-6 w-6"/>
                        </button>

                        {/* Search bar */}
                        <Form
                            method="GET"
                            action="/search"
                            className="flex flex-1 max-w-2xl mx-auto"
                        >
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    name="q"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Search ${loaderData?.settings?.searchEngine || ''}`}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pl-10 pr-20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Search
                                </button>
                            </div>
                        </Form>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>

        {/* Scroll to top button */}
        <a
            href="#page-top"
            className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-2 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            <ChevronUp className="h-6 w-6"/>
        </a>
        </body>
        </html>
    );
}
