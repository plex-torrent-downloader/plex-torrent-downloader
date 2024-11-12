import {Form, Link, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import {useState} from "react";
import { redirect } from "@remix-run/node";
import fs from '../fs.server';
import Bcrypt from '../bcrypt.server';
import jwt from "../jwt.server";
import search from '../search.server';
import { Save, LogOut, PowerOff } from 'lucide-react';

type LoaderData = {
  settings?: Settings;
  searchEngines: string[];
};

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Setup",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const action = async ({request, context}) => {
  const { settings } = context;

  if (settings?.password) {
    const cookies = request.headers.get('Cookie') || '';
    const authToken = decodeURIComponent(cookies.split('=').pop());
    try {
      if (!jwt.verify(authToken, settings.password)) {
        throw new Error("Invalid JWT");
      }
    } catch(e) {
      throw new Error("Unauthorized");
    }
  }

  const formData = await request.formData();
  const fileSystemRoot = formData.get('fileSystemRoot');
  try {
    await fs.access(fileSystemRoot);
  } catch(e) {
    throw new Error("FS Location not found!");
  }
  const setObject = {
    id: 1,
    fileSystemRoot,
    cacheSearchResults: !!formData.get('cacheSearchResults'),
    saveDownloadHistory: !!formData.get('saveDownloadHistory'),
    searchEngine: formData.get('searchEngine'),
    password: formData.get('password') === '' ? settings?.password : (await Bcrypt.hashPassword(formData.get('password')))
  }
  await db.settings.upsert({
    where: {
      id : 1
    },
    create: setObject,
    update: setObject
  });

  if (formData.get('password') !== '') {
    const authToken = jwt.sign({}, setObject.password, { expiresIn: '1w' });

    const isSecure = request.protocol === 'https';

    const secureFlag = isSecure ? '; Secure' : '';
    return redirect((await db.collections.count()) ? "/search" : "/collections", {
      headers: {
        "Set-Cookie": `auth=${encodeURIComponent(authToken)}${secureFlag}; SameSite=Lax; Secure; HttpOnly; Path=/`,
      },
    });
  }

  if (!(await db.collections.count())) {
    throw redirect('/collections', 302);
  }

  return null;
};

export const loader: LoaderFunction = async ({ context }) => {
  const { settings } = context;
  const searchEngines = search.getSearchEngines();
  return json({settings, searchEngines});
};

export default function Setup() {
  const settings = useLoaderData<LoaderData>();
  const [fileSystemRoot, setFileSystemRoot] = useState<string>(settings.settings?.fileSystemRoot ?? '');
  const [cacheSearchResults, setCacheSearchResults] = useState<boolean>(settings.settings?.cacheSearchResults ?? true);
  const [saveDownloadHistory, setSaveDownloadHistory] = useState<boolean>(settings.settings?.saveDownloadHistory ?? true);
  const [searchEngine, setSearchEngine] = useState<string>(settings.settings?.searchEngine ?? '');
  const [password, setPassword] = useState<string>('');

  const updatePassword = !!settings?.settings?.password;
  const isRecentlyUpdated = +new Date(settings.settings?.updatedAt) > (+new Date) - 1000;

  return (
      <Form method="post" className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {settings?.settings ? "Settings" : "Initial Setup"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select the location of your content root, for example, the filesystem path to your external HDD.
            </p>
          </div>

          {/* Success Alert */}
          {isRecentlyUpdated && (
              <div className="rounded-md bg-green-50 dark:bg-green-900 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Settings Updated!</p>
                  </div>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">System Settings</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plex Content Root</label>
                    <input
                        type="text"
                        name="fileSystemRoot"
                        value={fileSystemRoot}
                        onChange={(e) => setFileSystemRoot(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                          type="checkbox"
                          name="saveDownloadHistory"
                          checked={saveDownloadHistory}
                          onChange={(e) => setSaveDownloadHistory(!saveDownloadHistory)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Save Download History</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {updatePassword ? "Update password" : "Set a password (optional but recommended)"}
                    </label>
                    <input type="hidden" value="admin" name="username" />
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                    />
                  </div>

                  {settings.settings && (
                      <Link to="/reset">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-red-600 dark:border-red-500 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                          <PowerOff className="h-4 w-4 mr-2" />
                          Hard Reset
                        </button>
                      </Link>
                  )}

                  <button
                      type="button"
                      onClick={() => window.location.href = '/logout'}
                      className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Search Settings and Save Button Cards */}
            <div className="space-y-6">
              {/* Search Settings Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                  <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">Search Settings</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Engine</label>
                    <select
                        name="searchEngine"
                        value={searchEngine}
                        onChange={(e) => setSearchEngine(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                    >
                      {settings.searchEngines.map((engine) => (
                          <option key={engine} value={engine}>{engine}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                          type="checkbox"
                          name="cacheSearchResults"
                          checked={cacheSearchResults}
                          onChange={(e) => setCacheSearchResults(!cacheSearchResults)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cache Search Results</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                  <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">Save Settings</h2>
                </div>
                <div className="p-4">
                  <button
                      type="submit"
                      className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
  );
}
