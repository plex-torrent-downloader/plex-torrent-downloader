// queuecontext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {WebTorrent} from "~/contracts/WebTorrentInterface";

interface SocketContextType {
    socket: Socket | null;
    torrents: WebTorrent[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    torrents: []
});

export const useSocket = () => useContext(SocketContext);

export default function QueueProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [torrents, setTorrents] = useState<any[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const socketInstance = io({
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });

        socketInstance.on('connect', () => {});

        socketInstance.on('queue:update', (updatedTorrents) => {
            setTorrents(updatedTorrents);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            if (error.message.includes('Unauthorized')) {
                window.location.href = '/login';
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const contextValue: SocketContextType = {
        socket,
        torrents
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
}
