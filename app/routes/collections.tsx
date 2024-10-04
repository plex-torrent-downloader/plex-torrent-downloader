import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {db} from '../db.server';
import {useState} from "react";
import fs from '../fs.server';
import axios from "axios";
import Modal from '../components/Modal';
import {metaV1} from "@remix-run/v1-meta";

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Collections",
    viewport: "width=device-width,initial-scale=1",
  };
}


export const action = async ({request, context}) => {
  const { settings } = context;
  const formData = await request.json();
  const { collections } = formData;

  for (const collection of collections) {
    try {
      await fs.access(collection.location.replace('[content_root]', settings.fileSystemRoot));
    } catch(e) {
      return json({
        error: `Invalid FS location: ${collection.location}`
      }, 500);
    }
  }

  const existingCollections = await db.collections.findMany();
  const existingIds = new Set(existingCollections.map(c => c.id));

  const operations = [];

  for (const collection of collections) {
    if (collection.id && existingIds.has(collection.id)) {
      operations.push(
          db.collections.update({
            where: { id: collection.id },
            data: {
              name: collection.name,
              location: collection.location
            }
          })
      );
      existingIds.delete(collection.id);
    } else {
      // Create new collection
      operations.push(
          db.collections.create({
            data: {
              name: collection.name,
              location: collection.location
            }
          })
      );
    }
  }

  if (existingIds.size > 0) {
    operations.push(
        db.collections.deleteMany({
          where: {
            id: {
              in: Array.from(existingIds)
            }
          }
        })
    );
  }

  await db.$transaction(operations);

  return json({});
};

export const loader: LoaderFunction = async (input) => {
  const collections = await db.collections.findMany();
  return json({
    loader: collections
  });
};

interface Collection {
  id?: number;
  name: string;
  location: string;
}

export default function Collections() {
  const {loader} = useLoaderData();
  const initData = loader && loader.length ? loader.map(c => ({
    id: c.id,
    name: c.name,
    location: c.location
  })) : [{name: 'Movies', location: '[content_root]/movies'}];
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

  function addCollection(e) {
    e.preventDefault();
    setCollections([
      ...collections,
      {
        name: '',
        location: ''
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
    const updatedCollections = [...collections];
    updatedCollections[index] = {
      ...updatedCollections[index],
      name: e.target.value
    };
    setCollections(updatedCollections);
  }

  function setLocationUpdate(e, index: number) {
    e.preventDefault();
    const updatedCollections = [...collections];
    updatedCollections[index] = {
      ...updatedCollections[index],
      location: e.target.value
    };
    setCollections(updatedCollections);
  }

  return <>
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
      {error && <Modal title="Error" onClose={() => {setError(null)}}>
        <h5>An Error happened:</h5>
        <span>{error}</span>
        <br />
        <span>Are you sure that all paths are correct?</span>
      </Modal>}
      <div className="container-fluid">
        <h1 className="h3 mb-1 text-gray-800">Collections</h1>
        <p className="mb-4">Collections are places where you can quickly save content. For example: 'Movies' or 'TV Shows'</p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="card position-relative">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Collections</h6>
            </div>
            <div className="card-body text-right">
              <table className="table">
                {collections.map((collection: Collection, index: number) => {
                  return <tr key={index.toString()}>
                    <td>
                      <input type="text" className="w-100" value={collection.name} placeholder="Collection Name" onChange={(e) => setNameUpdate(e, index)} />
                    </td>
                    <td>
                      <input type="text" className="w-100" value={collection.location} placeholder="Filesystem Path" onChange={(e) => setLocationUpdate(e, index)} />
                    </td>
                    <td>
                      {collections.length > 1 && <a href="#" className="btn btn-danger btn-circle" onClick={e => setDelete(e, index)} title="Remove Collection">
                        <i className="fas fa-trash"></i>
                      </a>}
                    </td>
                  </tr>;
                })}
              </table>
              <a onClick={addCollection} className="btn btn-success btn-circle btn-lg" title="Add collection">
                <i className="fas fa-plus"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card position-relative">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Tools</h6>
            </div>
            <div className="card-body">
              <button type="submit" className="btn btn-primary btn-icon-split">
                  <span className="icon text-white-50">
                      <i className="fas fa-save"></i>
                  </span>
                <span className="text">Save Collections</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </Form>
  </>
}
