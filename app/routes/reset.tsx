import {Form, useLoaderData} from "@remix-run/react";
import {json} from "@remix-run/node";
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import {useState} from "react";
import axios from "axios";
import spawn from "~/spawn.server";

export const action = async ({request}) => {
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

export const loader = async ({request}) => {
  return json({
    collectionsCount: (await db.collections.count()),
    historyCount: (await db.downloaded.count()),
    searchCount: (await db.searchResults.count()),
    recentSearchesCount: (await db.recentSearches.count())
  });
};

export default function Index() {
  const loaderData:LoaderData = useLoaderData();
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
  return <ControlPanel name="Hard Reset" subtext="Please select which settings to delete.">
    <Form method="post" onSubmit={submit}>
      <table className="table text-white">
        <thead>
          <tr>
            <th>Setting</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr>
            <td>
              <h4>System Reset in progress.. Please Wait...</h4>
            </td>
          </tr> : <>
            <ResetRow value={clearSettings} setter={setClearSettings}>Settings</ResetRow>
            <ResetRow value={clearCollections} setter={setClearCollections} count={loaderData.collectionsCount}>Collections</ResetRow>
            <ResetRow value={clearCache} setter={setClearCache} count={loaderData.searchCount}>Cache</ResetRow>
            <ResetRow value={clearHistory} setter={setClearHistory} count={loaderData.historyCount}>Download History</ResetRow>
            <ResetRow value={clearRecentSearches} setter={setClearRecentSearches} count={loaderData.recentSearchesCount}>Recent Searches</ResetRow>
          </>}
          <tr>
            <td>
              <input disabled={loading} type="submit" value="Delete Settings" className="btn btn-danger w-100" />
            </td>
          </tr>
        </tbody>
      </table>
    </Form>
  </ControlPanel>
}

function ResetRow(props) {
  const {children, value, setter, count} = props;
  return <tr>
    <td>
      <label>
        <input type={"checkbox"} checked={value} onChange={() => setter(!value)} />
        &nbsp;Delete {children}
        {count && <span> ({count})</span>}
      </label>
    </td>
  </tr>;
}
