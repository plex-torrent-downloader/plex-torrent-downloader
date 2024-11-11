import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { db } from '~/db.server';
import Modal from '~/components/Modal';
import search from "~/search.server";
import { Calendar, Edit2, Trash2, Plus, Check, X, PlayCircle, Search as SearchIcon } from 'lucide-react';

export const loader: LoaderFunction = async () => {
    const scheduledDownloads = await db.scheduledDownloads.findMany({
        include: { collection: true },
    });
    const collections = await db.collections.findMany();
    const searchEngines = search.getSearchEngines();
    return json({ scheduledDownloads, collections, searchEngines });
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const action = formData.get('_action');

    if (action === 'create' || action === 'update') {
        const data = {
            searchTerm: formData.get('searchTerm') as string,
            engine: formData.get('engine') as string,
            seasonNumber: parseInt(formData.get('seasonNumber') as string),
            episodeNumber: parseInt(formData.get('episodeNumber') as string),
            isActive: formData.get('isActive') === 'on',
            dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
            collectionId: parseInt(formData.get('collectionId') as string),
        };

        if (action === 'create') {
            await db.scheduledDownloads.create({ data });
            return json({ success: true, message: 'Scheduled download added successfully' });
        } else {
            const id = parseInt(formData.get('id') as string);
            await db.scheduledDownloads.update({ where: { id }, data });
            return json({ success: true, message: 'Scheduled download updated successfully' });
        }
    } else if (action === 'delete') {
        const id = parseInt(formData.get('id') as string);
        await db.scheduledDownloads.delete({ where: { id } });
        return json({ success: true, message: 'Scheduled download deleted successfully' });
    }
};

export default function ScheduledDownloads() {
    const { scheduledDownloads, collections, searchEngines } = useLoaderData();
    const actionData = useActionData();
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const [formData, setFormData] = useState({
        searchTerm: "",
        engine: "",
        seasonNumber: "",
        episodeNumber: "",
        dayOfWeek: "",
        collectionId: "",
        isActive: true
    });

    useEffect(() => {
        if (actionData?.success) {
            setEditingId(null);
            setModalMessage(actionData.message);
            setShowModal(true);
        }
    }, [actionData]);

    useEffect(() => {
        const editingDownload = editingId
            ? scheduledDownloads.find((sd) => sd.id === editingId)
            : null;

        if (editingDownload) {
            setFormData({
                searchTerm: editingDownload.searchTerm || "",
                engine: editingDownload.engine || "",
                seasonNumber: editingDownload.seasonNumber?.toString() || "",
                episodeNumber: editingDownload.episodeNumber?.toString() || "",
                dayOfWeek: editingDownload.dayOfWeek?.toString() || "",
                collectionId: editingDownload.collectionId?.toString() || "",
                isActive: editingDownload.isActive ?? true
            });
        } else {
            setFormData({
                searchTerm: "",
                engine: "",
                seasonNumber: "",
                episodeNumber: "",
                dayOfWeek: "",
                collectionId: "",
                isActive: true
            });
        }
    }, [editingId, scheduledDownloads]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    return (
        <>
            {showModal && (
                <Modal
                    title="Success"
                    onClose={() => setShowModal(false)}
                    buttons={[{
                        label: 'Continue',
                        action: () => setShowModal(false),
                        variant: 'primary'
                    }]}
                >
                    <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <p className="text-gray-600 dark:text-gray-300">{modalMessage}</p>
                    </div>
                </Modal>
            )}

            <div className="min-h-screen p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Downloads</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your scheduled downloads here
                    </p>
                </div>

                {/* Add/Edit Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                        <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">
                            {editingId ? "Edit" : "Add"} Scheduled Download
                        </h2>
                    </div>

                    <Form method="post" className="p-4">
                        <input type="hidden" name="_action" value={editingId ? "update" : "create"} />
                        {editingId && <input type="hidden" name="id" value={editingId} />}

                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                            {/* Search Term */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search Term
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        name="searchTerm"
                                        value={formData.searchTerm}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="Enter search term"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Search Engine */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search Engine
                                </label>
                                <select
                                    name="engine"
                                    value={formData.engine}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    required
                                >
                                    <option value="">Select Engine</option>
                                    {searchEngines.map((engine) => (
                                        <option key={engine} value={engine}>{engine}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Season Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Season Number
                                </label>
                                <input
                                    type="number"
                                    name="seasonNumber"
                                    value={formData.seasonNumber}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="Enter season number"
                                    required
                                />
                            </div>

                            {/* Episode Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Episode Number
                                </label>
                                <input
                                    type="number"
                                    name="episodeNumber"
                                    value={formData.episodeNumber}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="Enter episode number"
                                    required
                                />
                            </div>

                            {/* Day of Week */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Day of Week
                                </label>
                                <select
                                    name="dayOfWeek"
                                    value={formData.dayOfWeek}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    required
                                >
                                    <option value="">Select Day of Week</option>
                                    {daysOfWeek.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Collection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Collection
                                </label>
                                <select
                                    name="collectionId"
                                    value={formData.collectionId}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    required
                                >
                                    <option value="">Select Collection</option>
                                    {collections.map((collection) => (
                                        <option key={collection.id} value={collection.id}>
                                            {collection.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="relative flex items-start mb-6">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label className="font-medium text-gray-700 dark:text-gray-300">Active</label>
                                <p className="text-gray-500 dark:text-gray-400">Enable or disable this scheduled download</p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
                        >
                            {editingId ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {editingId ? "Update" : "Add"} Scheduled Download
                        </button>
                    </Form>
                </div>

                {/* Downloads Table Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                        <h2 className="text-lg font-medium text-blue-600 dark:text-blue-400">Scheduled Downloads</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {/* ... (keep existing th elements but update their classes) */}
                                {/* Example of updated th: */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Search Term
                                </th>
                                {/* ... repeat for other th elements */}
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {scheduledDownloads.map((download) => (
                                <tr key={download.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {download.searchTerm}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {download.engine}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {download.seasonNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {download.episodeNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {daysOfWeek[download.dayOfWeek]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${download.isActive
                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                                        >
                                            {download.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setEditingId(download.id)}
                                                className="text-amber-600 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-400"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>

                                            <Form method="post" className="inline">
                                                <input type="hidden" name="_action" value="delete" />
                                                <input type="hidden" name="id" value={download.id} />
                                                <button
                                                    type="submit"
                                                    className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
