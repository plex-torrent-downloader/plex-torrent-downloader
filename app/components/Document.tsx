import React, { useState, useEffect } from 'react';
import { Form, Links, Meta, useLoaderData, useLocation, useSearchParams, Link, useTransition } from '@remix-run/react';
import { Sun, Moon, ChevronUp, Menu, X, Download, Search, Settings, Grid, Calendar, PlayCircle, History, Loader2 } from 'lucide-react';
import {useSocket} from '../contexts/QueueContext';
import Notifications from './Notifications';

export default function Document({ children }) {
    const location = useLocation();
    const transition = useTransition();
    const loaderData = useLoaderData();
    const [queueCount, setQueueCount] = useState<number>(loaderData?.torrents?.length || 0);
    const [searchParams] = useSearchParams();
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isDark, setIsDark] = useState(false);
    const currentUrl = location.pathname;

    const { torrents } = useSocket();
    const totalPercent = torrents.reduce((acc, torrent) => {
        return acc + torrent.percent;
    }, 0);
    const percent = totalPercent / torrents.length;

    useEffect(() => {
        setQueueCount(torrents.length);
    }, [torrents]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                setIsDark(storedTheme === 'dark');
            } else {
                const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDark(darkModePreference);
            }

            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e) => {
                if (!localStorage.getItem('theme')) {
                    setIsDark(e.matches);
                }
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, []);

    // Update localStorage when dark mode changes
    const toggleDarkMode = () => {
        const newDarkMode = !isDark;
        setIsDark(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    const isActive = (path) => {
        return location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
    };

    if (currentUrl === '/login') {
        return (
            <html lang="en" className={`h-full ${isDark ? 'dark' : ''}`}>
            <head>
                <Meta />
                <Links />
            </head>
            <body className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950">
            {children}
            </body>
            </html>
        );
    }

    const navItems = loaderData?.settings ? [
        { path: '/queue', icon: Download, label: `Queue (${queueCount || 0})` },
        { path: '/search', icon: Search, label: 'Search' },
        { path: '/history', icon: History, label: 'History' },
        { path: '/setup', icon: Settings, label: 'Settings' },
        { path: '/collections', icon: Grid, label: 'Collections' },
        { path: '/scheduled_downloads', icon: Calendar, label: 'Scheduled Downloads' },
    ] : [
        { path: '/setup', icon: PlayCircle, label: 'First Time Setup' },
    ];

    return (
        <html lang="en" className={`h-full ${isDark ? 'dark' : ''}`}>
        <head>
            <Meta />
            <Links />
        </head>
        <body className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <div className="min-h-screen flex">
                <Notifications />
                {sidebarOpen && isMobile && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                    <aside
                        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-gradient-to-b from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
                            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } ${!isMobile ? 'lg:relative' : ''}`}
                    >
                        <div className="flex h-16 items-center justify-between px-4 border-b border-blue-500/30">
                            <div className="flex items-center space-x-3">
                                <a href="/" className="flex items-center space-x-3 text-white">
                                    <Download className="h-8 w-8 rotate-[-15deg]" />
                                </a>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={toggleDarkMode}
                                        className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                                        aria-label="Toggle dark mode"
                                    >
                                        {isDark ? (
                                            <Sun className="h-5 w-5" />
                                        ) : (
                                            <Moon className="h-5 w-5" />
                                        )}
                                    </button>
                                    {transition.state !== "idle" && (
                                        <div className="text-white">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden text-white hover:text-gray-200 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto px-2 py-4">
                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    if (item.path === '/queue' && percent > 0) {
                                        return (
                                            <Link
                                                data-testid={`sidebar-${item.label.replace(/\s+/g, '')}`}
                                                key={item.path}
                                                to={item.path}
                                                className={`relative flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors overflow-hidden ${
                                                    isActive(item.path)
                                                        ? 'text-white'
                                                        : 'text-gray-100 hover:bg-white/10'
                                                }`}
                                                style={{
                                                    background: isActive(item.path)
                                                        ? `linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.15) ${percent}%, rgba(255,255,255,0.05) ${percent}%, rgba(255,255,255,0.05) 100%)`
                                                        : `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${percent}%, transparent ${percent}%, transparent 100%)`
                                                }}
                                            >
                                                <item.icon className="h-5 w-5 flex-shrink-0 relative z-10" />
                                                <span className="truncate relative z-10">{item.label}</span>
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            data-testid={`sidebar-${item.label.replace(/\s+/g, '')}`}
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                                                isActive(item.path)
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-gray-100 hover:bg-white/10'
                                            }`}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    </aside>

                    <div className="flex-1 flex flex-col min-w-0">
                        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
                            <div className="flex h-16 items-center gap-4 px-4">
                                <button
                                    data-testid="sidebarToggle"
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>

                                <Form
                                    method="GET"
                                    action="/search"
                                    className="flex flex-1 max-w-2xl mx-auto"
                                >
                                    <div className="relative w-full">
                                        <input
                                            data-testid="searchInput"
                                            type="text"
                                            name="q"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder={`Search ${loaderData?.settings?.searchEngine || ''}`}
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 pl-10 pr-20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        <button
                                            data-testid="searchButton"
                                            type="submit"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 dark:bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                                        >
                                            {transition.state !== "idle" && transition.location.pathname === '/search' ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : <>Search</>}
                                        </button>
                                    </div>
                                </Form>
                            </div>
                        </header>

                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
                            {children}
                        </main>
                    </div>
                </div>
        </body>
        </html>
    );
}
