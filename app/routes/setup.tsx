import {Form, Link, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings, JellyfinServer } from '@prisma/client';
import {db} from '../db.server';
import {useState} from "react";
import { redirect } from "@remix-run/node";
import fs from '../fs.server';
import Bcrypt from '../bcrypt.server';
import jwt from "../jwt.server";
import search from '../search.server';
import { Save, LogOut, PowerOff, Check, X, HardDrive, Shield, Search as SearchIcon, Cpu, User, Tv, ChevronRight, Plus } from 'lucide-react';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';

async function checkFFmpeg(): Promise<boolean> {
  const exec = promisify(cpExec);
  try {
    await exec('which ffmpeg');
    return true;
  } catch (error) {
    return false;
  }
}

type LoaderData = {
  settings?: Settings;
  searchEngines: string[];
  ffmpegInstalled?: boolean;
  jellyfinServers: Partial<JellyfinServer>[];
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
  const ffmpegInstalled = await checkFFmpeg();
  const jellyfinServers = await db.jellyfinServer.findMany({
    select: { id: true, name: true, url: true, isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  return json({settings, searchEngines, ffmpegInstalled, jellyfinServers});
};

export default function Setup() {
  const settings = useLoaderData<LoaderData>();
  const { jellyfinServers } = settings;
  const [fileSystemRoot, setFileSystemRoot] = useState<string>(settings.settings?.fileSystemRoot ?? '');
  const [cacheSearchResults, setCacheSearchResults] = useState<boolean>(settings.settings?.cacheSearchResults ?? true);
  const [saveDownloadHistory, setSaveDownloadHistory] = useState<boolean>(settings.settings?.saveDownloadHistory ?? true);
  const [searchEngine, setSearchEngine] = useState<string>(settings.settings?.searchEngine ?? '');
  const [password, setPassword] = useState<string>('');

  const updatePassword = !!settings?.settings?.password;
  const isRecentlyUpdated = +new Date(settings.settings?.updatedAt) > (+new Date) - 1000;

  return (
    <Form method="post" className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {settings?.settings ? "Settings" : "Initial Setup"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure your content root, search engine, and security options.
            </p>
          </div>
          <button
            data-testid="saveSettings"
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>

        {/* Success Alert */}
        {isRecentlyUpdated && (
          <div className="flex items-center space-x-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-4 py-3">
            <Check className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Settings saved successfully.</p>
          </div>
        )}

        {/* General */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">General</h2>
          </div>
          <div className="px-5 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plex Content Root
              </label>
              <input
                data-testid="plexContentRoot"
                type="text"
                name="fileSystemRoot"
                value={fileSystemRoot}
                onChange={(e) => setFileSystemRoot(e.target.value)}
                placeholder="/mnt/media"
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                The filesystem path to your Plex media root, e.g. the path to your external HDD.
              </p>
            </div>

            <div className="flex items-start space-x-3 pt-1">
              <input
                data-testid="saveDownloadHistory"
                type="checkbox"
                id="saveDownloadHistory"
                name="saveDownloadHistory"
                checked={saveDownloadHistory}
                onChange={() => setSaveDownloadHistory(!saveDownloadHistory)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <label htmlFor="saveDownloadHistory" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <span className="font-medium">Save download history</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">Enables video playback from the history page.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <SearchIcon className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Search</h2>
          </div>
          <div className="px-5 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Engine
              </label>
              <select
                data-testid="searchEngine"
                name="searchEngine"
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              >
                {settings.searchEngines.map((engine) => (
                  <option key={engine} value={engine}>{engine}</option>
                ))}
              </select>
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="cacheSearchResults"
                name="cacheSearchResults"
                checked={cacheSearchResults}
                onChange={() => setCacheSearchResults(!cacheSearchResults)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <label htmlFor="cacheSearchResults" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <span className="font-medium">Cache search results</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">Speeds up repeated searches by storing results temporarily.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Security</h2>
          </div>
          <div className="px-5 py-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {updatePassword ? "Update password" : "Password"}
              {!updatePassword && <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional but recommended)</span>}
            </label>
            <input type="hidden" value="admin" name="username" />
            <input
              data-testid="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={updatePassword ? "Enter new password to change" : "Set a password"}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* System */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <Cpu className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">System</h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">FFmpeg</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Required for hardware-accelerated video transcoding.</p>
              </div>
              {settings?.ffmpegInstalled ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  <Check className="h-3.5 w-3.5" />
                  <span>Installed</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                  <X className="h-3.5 w-3.5" />
                  <span>Not installed</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Jellyfin Integrations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Tv className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Jellyfin Integrations</h2>
            </div>
            <Link
              to="/jellyfin-integrations"
              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
          </div>

          {jellyfinServers.length === 0 ? (
            <div className="px-5 py-6 flex flex-col items-center text-center space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No Jellyfin servers configured. Connect one to automatically notify Jellyfin when downloads complete.
              </p>
              <Link
                to="/jellyfin-integrations"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Jellyfin Server
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {jellyfinServers.map(server => (
                <div key={server.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{server.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{server.url}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    server.isActive
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {server.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account actions */}
        {settings.settings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <User className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Account</h2>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.location.href = '/logout'}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </button>

              <Link to="/reset">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Hard Reset
                </button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </Form>
  );
}
