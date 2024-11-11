import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import {db} from '../db.server';
import {useState} from "react";
import axios from "axios";
import spawn from "~/spawn.server";
import { Trash2, AlertTriangle, Database, Square, CheckSquare, Loader2 } from 'lucide-react';

export const action = async ({ request }) => {
  const formData = await request.json();
  if (formData.clearSettings) {
    await db.$executeRaw`DROP TABLE settings;`;
  }
  if (formData.clearCollections) {
    await db.$executeRaw`DROP TABLE collections;`;
  }
  if (formData.clearCache) {
    await db.$executeRaw`DROP TABLE search_results;`;
  }
  if (formData.clearHistory) {
    await db.$executeRaw`DROP TABLE downloaded;`;
  }
  if (formData.clearRecentSearches) {
    await db.$executeRaw`DROP TABLE recent_searches;`;
  }
  try {
    await spawn('prisma', ['db', 'push']);
  } catch (e) {
    throw new Error('There was an error running: prisma db push. Please run this command manually.')
  }
  return json({success: true});
};

interface LoaderData {
  collectionsCount: number;
  historyCount: number;
  searchCount: number;
  recentSearchesCount: number;
}

export const loader: LoaderFunction = async () => {
  return json({
    collectionsCount: (await db.collections.count()),
    historyCount: (await db.downloaded.count()),
    searchCount: (await db.searchResults.count()),
    recentSearchesCount: (await db.recentSearches.count())
  });
};

export default function Index() {
  const loaderData = useLoaderData();
  const [loading, setLoading] = useState<boolean>(false);
  const [clearSettings, setClearSettings] = useState<boolean>(true);
  const [clearCollections, setClearCollections] = useState<boolean>(true);
  const [clearHistory, setClearHistory] = useState<boolean>(true);
  const [clearCache, setClearCache] = useState<boolean>(true);
  const [clearRecentSearches, setClearRecentSearches] = useState<boolean>(true);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    const confirmed = await showConfirmDialog();
    if (!confirmed) return;

    try {
      setLoading(true);
      await axios({
        url: '/reset',
        method: 'POST',
        data: {
          clearSettings,
          clearCollections,
          clearHistory,
          clearCache,
          clearRecentSearches
        }
      });
      window.location.href = '/';
    } catch(e) {
      console.error(e);
      alert(`There was an error processing your request. ${e.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  function ResetRow({ children, value, setter, count }: {
    children: React.ReactNode;
    value: boolean;
    setter: (value: boolean) => void;
    count?: number;
  }) {
    return (
        <button
            type="button"
            onClick={() => setter(!value)}
            className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {value ?
              <CheckSquare className="h-6 w-6 text-red-600" /> :
              <Square className="h-6 w-6 text-gray-400" />
          }
          <span className={`flex-1 text-left ${value ? 'text-red-600' : 'text-gray-600'}`}>
          Delete {children}
        </span>
          {count > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {count}
          </span>
          )}
        </button>
    );
  }

  return (
      <div className="min-h-screen p-6">
        {/* Warning Banner */}
        <div className="rounded-md bg-yellow-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Danger Zone
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are about to perform destructive operations. This action cannot be undone.
                  Please review your selections carefully before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Form method="post" onSubmit={submit} className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hard Reset</h1>
            <p className="mt-1 text-sm text-gray-500">
              Select which settings to delete, then Prisma will re-create them
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Database className="h-5 w-5 text-gray-400 dark:text-white mr-2" />
                Reset Settings
              </h2>
            </div>

            <div className="p-4 space-y-2">
              <ResetRow
                  value={clearSettings}
                  setter={setClearSettings}
              >
                Settings
              </ResetRow>

              <ResetRow
                  value={clearCollections}
                  setter={setClearCollections}
                  count={loaderData.collectionsCount}
              >
                Collections
              </ResetRow>

              <ResetRow
                  value={clearCache}
                  setter={setClearCache}
                  count={loaderData.searchCount}
              >
                Cache
              </ResetRow>

              <ResetRow
                  value={clearHistory}
                  setter={setClearHistory}
                  count={loaderData.historyCount}
              >
                Download History
              </ResetRow>

              <ResetRow
                  value={clearRecentSearches}
                  setter={setClearRecentSearches}
                  count={loaderData.recentSearchesCount}
              >
                Recent Searches
              </ResetRow>

              <div className="pt-4 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Deleting...' : 'Delete Selected Items'}
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="mt-4 text-sm text-gray-500 text-center">
            Note: After deletion, Prisma will automatically recreate the necessary database structures.
          </p>
        </Form>
      </div>
  );
}

// Add this helper function for better confirmation UX
function showConfirmDialog(): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
        "WARNING: You are about to delete selected data. This action cannot be undone. Are you sure you want to proceed?"
    );
    resolve(confirmed);
  });
}
