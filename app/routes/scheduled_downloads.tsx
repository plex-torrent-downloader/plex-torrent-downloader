import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { db } from '~/db.server';
import Modal from '~/components/Modal';
import search from "~/search.server";

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
                    buttons={[
                        {
                            label: 'Continue',
                            action: () => setShowModal(false),
                            class: 'btn btn-primary'
                        }
                    ]}
                >
                    <h5>{modalMessage}</h5>
                </Modal>
            )}
            <div className="container-fluid">
                <h1 className="h3 mb-2 text-gray-800">Scheduled Downloads</h1>
                <p className="mb-4">Manage your scheduled downloads here</p>

                <div className="card shadow mb-4">
                    <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">
                            {editingId ? "Edit" : "Add"} Scheduled Download
                        </h6>
                    </div>
                    <div className="card-body">
                        <Form method="post" className="user">
                            <input
                                type="hidden"
                                name="_action"
                                value={editingId ? "update" : "create"}
                            />
                            {editingId && <input type="hidden" name="id" value={editingId} />}
                            <div className="form-group row">
                                <div className="col-sm-6 mb-3 mb-sm-0">
                                    <label htmlFor="searchTerm" className="form-label">
                                        Search Term
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="searchTerm"
                                        name="searchTerm"
                                        placeholder="Enter search term"
                                        value={formData.searchTerm}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-sm-6">
                                    <label htmlFor="engine" className="form-label">
                                        Search Engine
                                    </label>
                                    <select
                                        id="engine"
                                        name="engine"
                                        className="form-control"
                                        value={formData.engine}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Engine</option>
                                        {searchEngines.map((engine) => (
                                            <option key={engine} value={engine}>
                                                {engine}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col-sm-6 mb-3 mb-sm-0">
                                    <label htmlFor="seasonNumber" className="form-label">
                                        Season Number
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="seasonNumber"
                                        name="seasonNumber"
                                        placeholder="Enter season number"
                                        value={formData.seasonNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-sm-6">
                                    <label htmlFor="episodeNumber" className="form-label">
                                        Episode Number
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="episodeNumber"
                                        name="episodeNumber"
                                        placeholder="Enter episode number"
                                        value={formData.episodeNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col-sm-6 mb-3 mb-sm-0">
                                    <label htmlFor="dayOfWeek" className="form-label">
                                        Day of Week
                                    </label>
                                    <select
                                        id="dayOfWeek"
                                        name="dayOfWeek"
                                        className="form-control"
                                        value={formData.dayOfWeek}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Day of Week</option>
                                        {daysOfWeek.map((day, index) => (
                                            <option key={index} value={index}>
                                                {day}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-sm-6">
                                    <label htmlFor="collectionId" className="form-label">
                                        Collection
                                    </label>
                                    <select
                                        id="collectionId"
                                        name="collectionId"
                                        className="form-control"
                                        value={formData.collectionId}
                                        onChange={handleInputChange}
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
                            <div className="form-group">
                                <div className="custom-control custom-checkbox small">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                    />
                                    <label className="custom-control-label" htmlFor="isActive">
                                        Active
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-user btn-block">
                                {editingId ? "Update" : "Add"} Scheduled Download
                            </button>
                        </Form>
                    </div>
                </div>

                <div className="card shadow mb-4">
                    <div className="card-header py-3">
                        <h6 className="m-0 font-weight-bold text-primary">Scheduled Downloads</h6>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered" id="dataTable" width="100%" cellSpacing="0">
                                <thead>
                                <tr>
                                    <th>Search Term</th>
                                    <th>Engine</th>
                                    <th>Season</th>
                                    <th>Episode</th>
                                    <th>Day</th>
                                    <th>Active</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {scheduledDownloads.map(download => (
                                    <tr key={download.id}>
                                        <td>{download.searchTerm}</td>
                                        <td>{download.engine}</td>
                                        <td>{download.seasonNumber}</td>
                                        <td>{download.episodeNumber}</td>
                                        <td>{daysOfWeek[download.dayOfWeek]}</td>
                                        <td>{download.isActive ? 'Yes' : 'No'}</td>
                                        <td>
                                            <button
                                                onClick={() => setEditingId(download.id)}
                                                className="btn btn-warning btn-circle btn-sm mr-2"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <Form method="post" className="d-inline">
                                                <input type="hidden" name="_action" value="delete" />
                                                <input type="hidden" name="id" value={download.id} />
                                                <button type="submit" className="btn btn-danger btn-circle btn-sm">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </Form>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
