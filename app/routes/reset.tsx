import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
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
  try {
    await spawn('prisma', ['db', 'push']);
  } catch (e) {
    throw new Error('There was an error running: prisma db push. Please run this command manually.')
  }
  return json({success: true});
};

export default function Index() {
  const [loading, setLoading] = useState<boolean>(false);
  const [clearSettings, setClearSettings] = useState<boolean>(true);
  const [clearCollections, setClearCollections] = useState<boolean>(true);
  const [clearHistory, setClearHistory] = useState<boolean>(true);
  const [clearCache, setClearCache] = useState<boolean>(true);

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
          clearCache
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
            <ResetRow value={clearSettings} setter={setClearSettings}>Reset Settings</ResetRow>
            <ResetRow value={clearCollections} setter={setClearCollections}>Reset Collections</ResetRow>
            <ResetRow value={clearCache} setter={setClearCache}>Clear Cache</ResetRow>
            <ResetRow value={clearHistory} setter={setClearHistory}>Clear Download History</ResetRow>
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

function ResetRow({children, value, setter}) {
  return <tr>
    <td>
      <label>
        <input type={"checkbox"} checked={value} onChange={() => setter(!value)} />
        &nbsp;{children}
      </label>
    </td>
  </tr>;
}
