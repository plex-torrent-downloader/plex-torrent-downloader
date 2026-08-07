import { db } from './db.server';
import axios from 'axios';

async function notifyJellyfin(filePaths: string[]): Promise<void> {
    console.log('notifyJellyin', filePaths);
    const servers = await db.jellyfinServer.findMany({ where: { isActive: true } });
    if (!servers.length) {
        return;
    }

    const updates = { Updates: filePaths.map(path => ({ Path: path, UpdateType: 'Created' })) };

    await Promise.allSettled(
        servers.map(server =>
            axios.post(`${server.url}/Library/Media/Updated`, updates, {
                headers: { Authorization: `MediaBrowser Token="${server.apiKey}"` },
                timeout: 10000
            }).catch(e => console.warn(`Jellyfin notification failed for ${server.name}: ${e.message}`, e.response?.data))
        )
    );
}

export async function testConnection(id: number): Promise<{ ok: boolean; error?: string }> {
    const server = await db.jellyfinServer.findUnique({ where: { id } });
    if (!server) {
        throw new Error(`Server #${id} not found in the database.`);
    }
    try {
        await axios.get(`${server.url}/System/Info`, {
            headers: { Authorization: `MediaBrowser Token="${server.apiKey}"` },
            timeout: 5000
        });
        return { ok: true };
    } catch (e: any) {
        const status = e.response?.status;
        const message = status
            ? `HTTP ${status}: ${e.response?.statusText ?? e.message}`
            : e.message;
        return { ok: false, error: message };
    }
}

export default notifyJellyfin;
