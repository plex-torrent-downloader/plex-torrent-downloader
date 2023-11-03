import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Settings } from '@prisma/client';
import {db} from '../db.server';
import {useState} from "react";
import { redirect } from "@remix-run/node";
import fs from '../fs.server';
import Bcrypt from '../bcrypt.server';
import RequireAuth from "~/middleware/RequireAuth.server";
import jwt from "../jwt.server";

type LoaderData = {
  settings?: Settings;
};

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Setup",
    viewport: "width=device-width,initial-scale=1",
  };
}

export const action = async ({request}) => {
  const settings = await db.settings.findUnique({
    where: {
      id: 1
    }
  });

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

export const loader: LoaderFunction = async ({ request }) => {
  const ft = RequireAuth(async ({settings}) => {
    return json({settings});
  });
  return ft({request});
};

export default function Setup() {
  const settings = useLoaderData<LoaderData>();
  const [fileSystemRoot, setFileSystemRoot] = useState<string>(settings.settings?.fileSystemRoot ?? '');
  const [cacheSearchResults, setCacheSearchResults] = useState<boolean>(settings.settings?.cacheSearchResults ?? true);
  const [saveDownloadHistory, setSaveDownloadHistory] = useState<boolean>(settings.settings?.saveDownloadHistory ?? true);
  const [searchEngine, setSearchEngine] = useState<string>(settings.settings?.searchEngine ?? '');
  const [password, setPassword] = useState<string>('');

  const updatePassword = !!settings?.settings?.password;

  function logout() {
    document.cookie = "auth=;";
    window.document.location = '/';
  }

  return <Form method="post">
    <div className="container-fluid">

      <h1 className="h3 mb-1 text-gray-800">{settings?.settings ? "Settings" : "Initial Setup"}</h1>
      <p className="mb-4">Please select the location of your content root, for example, the filesystem path to your external HDD.</p>

      {+new Date(settings.settings?.updatedAt) > (+ new Date) - 1000 && <div className="alert alert-success" role="alert">
        Settings Updated!
      </div>}

      <div className="row">
        <div className="col-lg-6">
          <div className="card position-relative">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">System Settings</h6>
            </div>
            <div className="card-body">
              <table className="table">
                <tr>
                  <td>Plex Content Root</td>
                  <td>
                    <input type="text" className="form-control" name="fileSystemRoot" value={fileSystemRoot} onChange={(e) => setFileSystemRoot(e.target.value)} />
                  </td>
                </tr>
                <tr>
                  <td>Save Download History</td>
                  <td>
                    <input type="checkbox" name="saveDownloadHistory" checked={saveDownloadHistory} onChange={(e) => setSaveDownloadHistory(!saveDownloadHistory)} />
                  </td>
                </tr>
                <tr>
                  <td>{
                    updatePassword ?
                        "Update password" :
                        "Set a password (optional but recommended)"
                  }</td>
                  <td>
                    <input type="hidden" value="admin" name="username" />
                    <input type="password" className="form-control" value={password} name="password" onChange={(e) => setPassword(e.target.value)} />
                  </td>
                </tr>
                {settings.settings && <tr>
                  <td>Hard Reset</td>
                  <td>
                    <a href="/reset" className="btn btn-danger btn-icon-split" onClick={() => logout()}>
                      <span className="icon text-white-50">
                          <i className="fa-solid fa-power-off"></i>
                      </span>
                      <span className="text">Hard Reset</span>
                    </a>
                  </td>
                </tr>}
                <tr>
                  <td colSpan={2}>
                    <button type="submit" className="btn btn-danger btn-icon-split" onClick={() => logout()}>
                      <span className="icon text-white-50">
                          <i className="fa-solid fa-right-from-bracket"></i>
                      </span>
                      <span className="text">Logout</span>
                    </button>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card position-relative">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Search Settings</h6>
            </div>
            <div className="card-body">
              <table className="table">
                <tr>
                  <td>Search Engine</td>
                  <td>
                    <select name="searchEngine" className="form-control" value={searchEngine} onChange={(e) => setSearchEngine(e.target.value)}>
                      <option>1377x.to</option>
                      <option>nyaa.si</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Cache Search Results</td>
                  <td>
                    <input type="checkbox" name="cacheSearchResults" checked={cacheSearchResults} onChange={(e) => setCacheSearchResults(!cacheSearchResults)} />
                  </td>
                </tr>
              </table>
            </div>
          </div>
          <div className="card position-relative mt-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Save Settings</h6>
            </div>
            <div className="card-body">
              <button type="submit" className="btn btn-primary btn-icon-split">
                <span className="icon text-white-50">
                    <i className="fas fa-save"></i>
                </span>
                <span className="text">Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  </Form>;
}
