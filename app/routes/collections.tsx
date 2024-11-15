import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction, MetaFunction} from "@remix-run/node";
import {db} from '../db.server';
import {useState} from "react";
import axios from "axios";
import Modal from '../components/Modal';
import { Plus, Trash2, Save, FolderOpen } from 'lucide-react';

export function meta(args) {
  return {
    charset: "utf-8",
    title: "Collections",
    viewport: "width=device-width,initial-scale=1",
  };
}

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
  const { loader } = useLoaderData();
  const initData = loader && loader.length ? loader.map(c => ({
    id: c.id,
    name: c.name,
    location: c.location
  })) : [{ name: 'Movies', location: '[content_root]/movies' }];

  const [collections, setCollections] = useState<Collection[]>(initData);
  const [error, setError] = useState<string>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  async function submit(e) {
    e.preventDefault();
    try {
      await axios({
        method: 'POST',
        url: '/collections',
        data: { collections }
      });
      setShowSuccess(true);
    } catch(e) {
      if (e.response?.data?.error) {
        setError(e.response.data.error);
        return;
      }
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
    const newCollections = [...collections];
    newCollections.splice(index, 1);
    setCollections(newCollections);
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

  return (
      <>
        {showSuccess && (
            <Modal
                title="Collections Updated"
                onClose={() => setShowSuccess(false)}
                buttons={[
                  {
                    label: 'Continue',
                    action: () => { window.location.href = '/'; },
                    class: 'inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }
                ]}
            >
              <h5 className="text-lg font-medium text-gray-900 dark:text-white">Collections saved successfully</h5>
            </Modal>
        )}

        {error && (
            <Modal title="Error" onClose={() => setError(null)}>
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900 dark:text-white">An Error occurred:</h5>
                <p className="text-red-600">{error}</p>
                <p className="text-sm text-gray-500">Are you sure that all paths are correct?</p>
              </div>
            </Modal>
        )}

        <Form method="post" onSubmit={submit} className="p-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Collections are places where you can quickly save content. For example: 'Movies' or 'TV Shows'
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Collections Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h2 className="text-lg font-medium text-blue-600">Collections</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {collections.map((collection: Collection, index: number) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                                type="text"
                                value={collection.name}
                                placeholder="Collection Name"
                                onChange={(e) => setNameUpdate(e, index)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <FolderOpen className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <input
                                  type="text"
                                  value={collection.location}
                                  placeholder="Filesystem Path"
                                  onChange={(e) => setLocationUpdate(e, index)}
                                  className="w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                          {collections.length > 1 && (
                              <button
                                  type="button"
                                  onClick={(e) => setDelete(e, index)}
                                  className="rounded-full p-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                          )}
                        </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={addCollection}
                        className="inline-flex items-center rounded-full bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tools Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h2 className="text-lg font-medium text-blue-600">Tools</h2>
                </div>
                <div className="p-4">
                  <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Collections
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </>
  );
}
