import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
import { Collections } from '@prisma/client';
import {db} from '../db.server';
import ControlPanel from "~/components/ControlPanel";
import {useState} from "react";
import fs from '../fs.server';
import axios from "axios";
import Modal from '../components/Modal';

export const action = async ({request}) => {
  const formData = await request.json();
  const {collections} = formData;
  const settings = await db.settings.findUnique({where: {id: 1}});
  for (const collection of collections) {
    try {
      await fs.access(collection.location.replace('[content_root]', settings.fileSystemRoot));
    } catch(e) {
      return json({
        error: `Invalid FS location: ${collection.location}`
      }, 500);
    }
  }
  await db.$transaction([
    db.collections.deleteMany(),
      ...collections.map(collection => {
        return db.collections.create({
          data: {
            name: collection.name,
            location: collection.location
          }
        })
      })
  ]);
  return json({});
};

export const loader: LoaderFunction = async ({ request }) => {
  const collections = await db.collections.findMany();
  return json({
    loader: collections
  });
};

interface Collection {
  name: string;
  location: string;
}

export default function Collections() {
  const {loader} = useLoaderData();
  const initData = loader && loader.length ? loader : [{name: 'Movies', location: '[content_root]/movies'}];
  const [collections, setCollections] = useState<Collection[]>(initData);
  const [error, setError] = useState<string>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  async function submit(e) {
    e.preventDefault();
    try {
      await axios({
        method: 'POST',
        url: '/collections',
        data: {
          collections
        }
      });
      setShowSuccess(true);
    } catch(e) {
      setError(e.toString());
    }
  }

  function setDuplcate(e, collection) {
    e.preventDefault();
    setCollections([
        ...collections,
      {
        ...collection
      }
    ]);
  }

  function setDelete(e, index: number) {
    e.preventDefault();
    collections.splice(index, 1);
    setCollections([
      ...collections
    ]);
  }

  function setNameUpdate(e, index: number) {
    e.preventDefault();
    collections[index].name = e.target.value;
    setCollections([
      ...collections
    ]);
  }

  function setLocationUpdate(e, index: number) {
    e.preventDefault();
    collections[index].location = e.target.value;
    setCollections([
      ...collections
    ]);
  }

  return <ControlPanel name="Collections" subtext="Collections are places where you can quickly save content. For example: 'Movies' or 'TV Shows'">
    {error && <Modal title="Error" onClose={() => {setError(null)}}>
      <h5>An Error happened:</h5>
      <span>{error}</span>
      <br />
      <span>Are you sure that all paths are correct?</span>
    </Modal>}
    {showSuccess && <Modal title="Collections Updated" onClose={() => {setShowSuccess(false)}} buttons={[
        {
          label: 'Continue',
          action() {
            window.location.href = '/';
          },
          class: 'btn btn-primary'
        }
    ]}>
      <h5>Collections saved successfully</h5>
    </Modal>}
    <Form method="post" onSubmit={submit}>
      <table className="table text-white">
        <thead>
          <tr>
            <th>Collection Name</th>
            <th>File Location</th>
            <th>Manage</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection: Collection, index: number) => {
            return <tr key={index.toString()}>
              <td>
                <input type="text" className="w-100" value={collection.name} onChange={(e) => setNameUpdate(e, index)} />
              </td>
              <td>
                <input type="text" className="w-100" value={collection.location} onChange={(e) => setLocationUpdate(e, index)} />
              </td>
              <td>
                {collections.length > 1 && <button title="Delete" className="btn btn-danger btn-xs" onClick={e => setDelete(e, index)}>[X]</button>}
                <button role='button' title="Duplicate" onClick={e => setDuplcate(e, collection)} className="btn btn-info btn-xs">[ DUP ]</button>
              </td>
            </tr>;
          })}
          <tr>
            <td colSpan={3}>
              <input type="submit" value="Save Collections" className="btn btn-primary w-100" />
            </td>
          </tr>
        </tbody>
      </table>
    </Form>
  </ControlPanel>
}
