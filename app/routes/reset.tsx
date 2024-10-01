import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import {db} from '../db.server';
import {useState} from "react";
import axios from "axios";
import spawn from "~/spawn.server";

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
    if (loading) {
      return;
    }
    if (!confirm("Are you sure you want to do this? This cannot be undone.")) {
      return;
    }
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

  function ResetRow(props) {
    const {children, value, setter, count} = props;
    return <label onClick={() => setter(!value)} className="w-100 cursor-pointer">
      <i className={`fa-regular ${value ? 'fa-square-check' : 'fa-square'} fa-2x cursor-pointer`}></i>
      <span className="text-large">&nbsp;Delete {children}</span>
      {count > 0 && <span> ({count})</span>}
    </label>
  }

  return <>
    <Form method="post" onSubmit={submit}>
      <div className="container-fluid">
        <h1 className="h3 mb-1 text-gray-800">Hard Reset</h1>
        <p className="mb-4">Select which settings to delete, then prisma will re-create them</p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="card position-relative">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Hard Reset Settings</h6>
            </div>
            <div className="card-body">
              <ResetRow value={clearSettings} setter={setClearSettings}>Settings</ResetRow>
              <ResetRow value={clearCollections} setter={setClearCollections} count={loaderData.collectionsCount}>Collections</ResetRow>
              <ResetRow value={clearCache} setter={setClearCache} count={loaderData.searchCount}>Cache</ResetRow>
              <ResetRow value={clearHistory} setter={setClearHistory} count={loaderData.historyCount}>Download History</ResetRow>
              <ResetRow value={clearRecentSearches} setter={setClearRecentSearches} count={loaderData.recentSearchesCount}>Recent Searches</ResetRow>
              <a className="btn btn-danger btn-icon-split" onClick={submit}>
                <span className="icon text-white-50">
                    <i className="fas fa-trash"></i>
                </span>
                <span className="text">Delete Settings</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </Form>
  </>
}

