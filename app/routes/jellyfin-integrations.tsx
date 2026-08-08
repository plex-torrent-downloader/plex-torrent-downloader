import { useState, useEffect } from 'react';
import { useLoaderData, useActionData, Form } from '@remix-run/react';
import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { db } from '~/db.server';
import Modal from '~/components/Modal';
import { Plus, Edit2, Trash2, Check, X, Wifi, Server } from 'lucide-react';
import axios from 'axios';
import type { JellyfinServer as PrismaJellyfinServer } from '@prisma/client';
type JellyfinServer = Omit<PrismaJellyfinServer, 'createdAt' | 'updatedAt'>;

export function meta() {
    return { charset: 'utf-8', title: 'Jellyfin Integrations', viewport: 'width=device-width,initial-scale=1' };
}

export const loader: LoaderFunction = async () => {
    const servers = await db.jellyfinServer.findMany({ orderBy: { createdAt: 'asc' } });
    return json({ servers });
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const action = formData.get('_action');

    if (action === 'create' || action === 'update') {
        const data = {
            name: formData.get('name') as string,
            url: (formData.get('url') as string).replace(/\/$/, ''),
            apiKey: formData.get('apiKey') as string,
            isActive: formData.get('isActive') === 'on',
        };
        if (action === 'create') {
            await db.jellyfinServer.create({ data });
            return json({ success: true, message: 'Server added successfully' });
        } else {
            const id = parseInt(formData.get('id') as string);
            await db.jellyfinServer.update({ where: { id }, data });
            return json({ success: true, message: 'Server updated successfully' });
        }
    }

    if (action === 'delete') {
        const id = parseInt(formData.get('id') as string);
        await db.jellyfinServer.delete({ where: { id } });
        return json({ success: true, message: 'Server removed' });
    }
};

const emptyForm = { name: '', url: '', apiKey: '', isActive: true };

export default function Integrations() {
    const { servers } = useLoaderData<{ servers: Partial<JellyfinServer>[] }>();
    const actionData = useActionData<{ success: boolean; message: string }>();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [testStatus, setTestStatus] = useState<Record<number, { state: 'loading' | 'ok' | 'fail'; error?: string }>>({});
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (actionData?.success) {
            setShowFormModal(false);
            setEditingId(null);
            setSuccessMessage(actionData.message);
            setShowSuccessModal(true);
        }
    }, [actionData]);

    useEffect(() => {
        if (editingId) {
            const server = servers.find(s => s.id === editingId);
            if (server) {
                setFormData({ name: server.name, url: server.url, apiKey: server.apiKey, isActive: server.isActive });
            }
        } else {
            setFormData(emptyForm);
        }
    }, [editingId, servers]);

    function openAdd() {
        setEditingId(null);
        setShowFormModal(true);
    }

    function openEdit(id: number) {
        setEditingId(id);
        setShowFormModal(true);
    }

    function closeForm() {
        setEditingId(null);
        setShowFormModal(false);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    async function testConnection(server: Partial<JellyfinServer>) {
        setTestStatus(prev => ({ ...prev, [server.id]: { state: 'loading' } }));
        try {
            const { data } = await axios.post(`/jellyfin_servers/test/${server.id}`);
            setTestStatus(prev => ({ ...prev, [server.id]: data.ok ? { state: 'ok' } : { state: 'fail', error: data.error } }));
        } catch {
            setTestStatus(prev => ({ ...prev, [server.id]: { state: 'fail', error: 'Request failed' } }));
        }
        setTimeout(() => setTestStatus(prev => { const n = { ...prev }; delete n[server.id]; return n; }), 6000);
    }

    return (
        <>
            {showSuccessModal && (
                <Modal
                    title="Success"
                    onClose={() => setShowSuccessModal(false)}
                    buttons={[{ label: 'Continue', action: () => setShowSuccessModal(false), variant: 'primary' }]}
                >
                    <div className="flex items-center space-x-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                        <p className="text-gray-600 dark:text-gray-300">{successMessage}</p>
                    </div>
                </Modal>
            )}

            {showFormModal && (
                <Modal
                    title={editingId ? 'Edit Jellyfin Server' : 'Add Jellyfin Server'}
                    onClose={closeForm}
                    className="max-w-lg"
                >
                    <Form method="post" className="space-y-4">
                        <input type="hidden" name="_action" value={editingId ? 'update' : 'create'} />
                        {editingId && <input type="hidden" name="id" value={editingId} />}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input
                                data-testid="serverName"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Home Server"
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                            <input
                                data-testid="serverUrl"
                                type="url"
                                name="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="http://192.168.1.100:8096"
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                            <input
                                data-testid="serverApiKey"
                                type="password"
                                name="apiKey"
                                value={formData.apiKey}
                                onChange={handleChange}
                                placeholder="Generate one in Jellyfin → Dashboard → API Keys"
                                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="flex items-center space-x-3 pt-1">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                        </div>

                        <button
                            data-testid="submitServer"
                            type="submit"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        >
                            {editingId ? 'Update Server' : 'Add Server'}
                        </button>
                    </Form>
                </Modal>
            )}

            <div className="min-h-screen p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jellyfin Integrations</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Notify Jellyfin servers when a download completes so they index new files immediately.
                        </p>
                    </div>
                    <button
                        data-testid="addServer"
                        onClick={openAdd}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Server
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                        <Server className="h-5 w-5 text-blue-500" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Jellyfin Servers</h2>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {servers.map(server => (
                            <div key={server.id} className="flex items-center justify-between px-5 py-4">
                                <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{server.name}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            server.isActive
                                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {server.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{server.url}</p>
                                </div>

                                <div className="flex items-center space-x-2 ml-4 shrink-0">
                                    {testStatus[server.id]?.state === 'loading' && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500">Testing…</span>
                                    )}
                                    {testStatus[server.id]?.state === 'ok' && (
                                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-600 dark:text-green-400">
                                            <Check className="h-3.5 w-3.5" /><span>Connected</span>
                                        </span>
                                    )}
                                    {testStatus[server.id]?.state === 'fail' && (
                                        <span className="inline-flex items-center space-x-1 text-xs font-medium text-red-600 dark:text-red-400" title={testStatus[server.id]?.error}>
                                            <X className="h-3.5 w-3.5" /><span>{testStatus[server.id]?.error ?? 'Failed'}</span>
                                        </span>
                                    )}

                                    <button
                                        data-testid="testServer"
                                        onClick={() => testConnection(server)}
                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        title="Test connection"
                                    >
                                        <Wifi className="h-3.5 w-3.5 mr-1" />
                                        Test
                                    </button>

                                    <button
                                        data-testid="editServer"
                                        onClick={() => openEdit(server.id)}
                                        className="text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-400"
                                        title="Edit"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>

                                    <Form method="post" className="inline">
                                        <input type="hidden" name="_action" value="delete" />
                                        <input type="hidden" name="id" value={server.id} />
                                        <button
                                            data-testid="deleteServer"
                                            type="submit"
                                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                            title="Remove"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </Form>
                                </div>
                            </div>
                        ))}

                        {servers.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                No Jellyfin servers configured. Click <strong>Add Server</strong> to get started.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
