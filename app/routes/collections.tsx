import {Form, useLoaderData} from "@remix-run/react";
import {json, LoaderFunction} from "@remix-run/node";
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
    setCollections([...collections, { name: '', location: '' }]);
  }

  function setDelete(e, index: number) {
    e.preventDefault();
    const newCollections = [...collections];
    newCollections.splice(index, 1);
    setCollections(newCollections);
  }

  function setNameUpdate(e, index: number) {
    e.preventDefault();
    const updated = [...collections];
    updated[index] = { ...updated[index], name: e.target.value };
    setCollections(updated);
  }

  function setLocationUpdate(e, index: number) {
    e.preventDefault();
    const updated = [...collections];
    updated[index] = { ...updated[index], location: e.target.value };
    setCollections(updated);
  }

  return (
    <>
      {showSuccess && (
        <Modal
          title="Collections Updated"
          onClose={() => setShowSuccess(false)}
          buttons={[{
            label: 'Continue',
            action: () => { window.location.href = '/'; },
            variant: 'primary'
          }]}
        >
          <p className="text-gray-600 dark:text-gray-300">Collections saved successfully.</p>
        </Modal>
      )}

      {error && (
        <Modal title="Error" onClose={() => setError(null)}>
          <div className="space-y-2">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Are all paths correct?</p>
          </div>
        </Modal>
      )}

      <Form method="post" onSubmit={submit} className="min-h-screen p-6">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Collections are folders where downloaded content is saved, e.g. Movies or TV Shows.
              </p>
            </div>
            <button
              data-testid="saveCollections"
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Collections
            </button>
          </div>

          {/* Collections list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Column labels */}
            <div className="grid grid-cols-[1fr_1fr_2.5rem] gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Path</span>
              <span />
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {collections.map((collection: Collection, index: number) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_2.5rem] gap-4 items-center px-5 py-3">
                  <input
                    data-testid="collectionName"
                    type="text"
                    value={collection.name}
                    placeholder="e.g. Movies"
                    onChange={(e) => setNameUpdate(e, index)}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  />
                  <div className="relative">
                    <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      data-testid="collectionLocation"
                      type="text"
                      value={collection.location}
                      placeholder="[content_root]/movies"
                      onChange={(e) => setLocationUpdate(e, index)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 pl-9"
                    />
                  </div>
                  {collections.length > 1 ? (
                    <button
                      data-testid="deleteCollection"
                      type="button"
                      onClick={(e) => setDelete(e, index)}
                      className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove collection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>
              ))}
            </div>

            {/* Add row */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <button
                data-testid="addCollection"
                type="button"
                onClick={addCollection}
                className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="h-4 w-4" />
                <span>Add collection</span>
              </button>
            </div>
          </div>

        </div>
      </Form>
    </>
  );
}