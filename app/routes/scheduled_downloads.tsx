import { useState, useEffect } from 'react';
import {useLoaderData, useActionData, Form, useNavigate} from '@remix-run/react';
import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { db } from '~/db.server';
import Modal from '~/components/Modal';
import search from "~/search.server";
import { Edit2, Trash2, Plus, Check, Search as SearchIcon, Download, Loader, Info, Clock, Calendar, ChevronRight } from 'lucide-react';
import moment from "moment";
import axios from "axios";
import type { ScheduledDownloads } from '@prisma/client';

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
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [downloadModal, setDownloadModal] = useState<[ScheduledDownloads, "loading"|"found"|"notfound"|"error"|null]>([null, null]);

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
            setShowFormModal(false);
            setModalMessage(actionData.message);
            setShowSuccessModal(true);
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

    function openAddModal() {
        setEditingId(null);
        setShowFormModal(true);
    }

    function openEditModal(id: number) {
        setEditingId(id);
        setShowFormModal(true);
    }

    function closeFormModal() {
        setEditingId(null);
        setShowFormModal(false);
    }

    async function downloadNextEpisode(download: ScheduledDownloads) {
        const {id} = download;
        setDownloadModal([download, 'loading']);
        try {
            const { data } = await axios.post(`/scheduled_downloads/download_next_episode/${id}`, {});
            if (data.didDownloadEpisode) {
                setDownloadModal([download, 'found']);
                navigate(".", { replace: true });
            } else {
                setDownloadModal([download, 'notfound']);
            }
        } catch (error) {
            console.error("Error downloading next episode:", error);
            setDownloadModal([download, 'error']);
        }
    }

    const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const [downloading, downloadStatus] = downloadModal;

    return (
        <>
            {showSuccessModal && (
                <Modal
                    title="Success"
                    onClose={() => setShowSuccessModal(false)}
                    buttons={[{
                        label: 'Continue',
                        action: () => setShowSuccessModal(false),
                        variant: 'primary'
                    }]}
                >
                    <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500" />
                        <p className="text-gray-600 dark:text-gray-300">{modalMessage}</p>
                    </div>
                </Modal>
            )}

            {showInfoModal && (
                <Modal
                    title="How the Scheduler Works"
                    onClose={() => setShowInfoModal(false)}
                >
                    <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start space-x-3">
                            <Clock className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Runs every 20 minutes</p>
                                <p className="mt-0.5 text-gray-500 dark:text-gray-400">Each cycle checks which active schedules match today's day of the week.</p>
                            </div>
                        </li>
                        <li className="flex items-start space-x-3">
                            <Calendar className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Day-of-week matching</p>
                                <p className="mt-0.5 text-gray-500 dark:text-gray-400">A schedule only fires on its configured day — e.g. a Thursday schedule is skipped on all other days.</p>
                            </div>
                        </li>
                        <li className="flex items-start space-x-3">
                            <SearchIcon className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Auto-formatted search query</p>
                                <p className="mt-0.5 text-gray-500 dark:text-gray-400">The search term and episode info are combined into a standard format, e.g. <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">The Bear S03E01</code>.</p>
                            </div>
                        </li>
                        <li className="flex items-start space-x-3">
                            <Download className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">First result wins</p>
                                <p className="mt-0.5 text-gray-500 dark:text-gray-400">The top result from the selected search engine is downloaded to the configured collection's folder.</p>
                            </div>
                        </li>
                        <li className="flex items-start space-x-3">
                            <ChevronRight className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Auto-increments episode number</p>
                                <p className="mt-0.5 text-gray-500 dark:text-gray-400">After a successful download, the episode number advances by 1 so the next run picks up the following episode automatically.</p>
                            </div>
                        </li>
                    </ul>
                </Modal>
            )}

            {showFormModal && (
                <Modal
                    title={editingId ? "Edit Scheduled Download" : "Add Scheduled Download"}
                    onClose={closeFormModal}
                    className="max-w-2xl"
                >
                    <Form method="post" className="space-y-4">
                        <input type="hidden" name="_action" value={editingId ? "update" : "create"} />
                        {editingId && <input type="hidden" name="id" value={editingId} />}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search Term
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                        data-testid="searchTerm"
                                        type="text"
                                        name="searchTerm"
                                        value={formData.searchTerm}
                                        onChange={handleInputChange}
                                        className="block w-full pl-9 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        placeholder="e.g. The Bear"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Search Engine
                                </label>
                                <select
                                    data-testid="engine"
                                    name="engine"
                                    value={formData.engine}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    required
                                >
                                    <option value="">Select Engine</option>
                                    {searchEngines.map((engine) => (
                                        <option key={engine} value={engine}>{engine}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Season Number
                                </label>
                                <input
                                    data-testid="seasonNumber"
                                    type="number"
                                    name="seasonNumber"
                                    value={formData.seasonNumber}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Episode Number
                                </label>
                                <input
                                    data-testid="episodeNumber"
                                    type="number"
                                    name="episodeNumber"
                                    value={formData.episodeNumber}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    placeholder="1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Day of Week
                                </label>
                                <select
                                    data-testid="dayOfWeek"
                                    name="dayOfWeek"
                                    value={formData.dayOfWeek}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    required
                                >
                                    <option value="">Select Day</option>
                                    {daysOfWeek.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Collection
                                </label>
                                <select
                                    data-testid="collection"
                                    name="collectionId"
                                    value={formData.collectionId}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
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

                        <div className="flex items-center space-x-3 pt-1">
                            <input
                                data-testid="isActive"
                                type="checkbox"
                                name="isActive"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Active
                            </label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">— enable or disable this schedule</span>
                        </div>

                        <button
                            data-testid="submit"
                            type="submit"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        >
                            {editingId ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {editingId ? "Update" : "Add"} Scheduled Download
                        </button>
                    </Form>
                </Modal>
            )}

            {downloadStatus && (
                <Modal
                    title="Download Next Episode"
                    onClose={() => setDownloadModal([null, null])}
                >
                    <div className="flex items-start space-x-3">
                        {downloadStatus === 'loading' && <p className="text-gray-600 dark:text-gray-300">
                          Searching for <i>{downloading.searchTerm}</i> Season {downloading.seasonNumber} Episode {downloading.episodeNumber}...
                          <Loader className="inline-block ml-2 h-5 w-5 text-blue-500 animate-spin" />
                        </p>}
                        {downloadStatus === 'found' && <>
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-gray-600 dark:text-gray-300">Episode {downloading.episodeNumber} was found and is downloading now.</p>
                        </>}
                        {downloadStatus === 'notfound' && <p className="text-gray-600 dark:text-gray-300">Episode {downloading.episodeNumber} was not found.</p>}
                        {downloadStatus === 'error' && <p className="text-red-600 dark:text-red-400">An error occurred while searching for episode {downloading.episodeNumber}.</p>}
                    </div>
                </Modal>
            )}

            <div className="min-h-screen p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Downloads</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Automatically download new episodes on a weekly schedule
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                            title="How the scheduler works"
                        >
                            <Info className="h-4 w-4 mr-1.5" />
                            How it works
                        </button>
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Schedule
                        </button>
                    </div>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Search Term
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Search Engine
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Season
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Episode
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Day of Week
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Last Download
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Active?
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {download.lastDownloaded ? moment(download.lastDownloaded).fromNow() : 'Never'}
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
                                                data-testid="edit"
                                                onClick={() => openEditModal(download.id)}
                                                className="text-amber-600 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-400"
                                                title="Edit Scheduled Download"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>

                                            <Form method="post" className="inline">
                                                <input type="hidden" name="_action" value="delete" />
                                                <input type="hidden" name="id" value={download.id} />
                                                <button
                                                    data-testid="delete"
                                                    type="submit"
                                                    className="text-red-600 dark:text-red-500 hover:text-red-900 dark:hover:text-red-400"
                                                    title="Delete Scheduled Download"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </Form>

                                            <button
                                                data-testid="download"
                                                onClick={() => downloadNextEpisode(download)}
                                                className="text-blue-600 dark:text-blue-500 hover:text-blue-900 dark:hover:text-blue-400"
                                                title="Download Next Episode Now"
                                            >
                                                <Download className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {scheduledDownloads.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No scheduled downloads yet. Click <strong>Add Schedule</strong> to get started.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
