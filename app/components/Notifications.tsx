import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/QueueContext';
import { X } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
}

export default function NotificationToasts() {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.on('message', ({ title, message }) => {
            const newNotification = {
                id: Math.random().toString(36).substr(2, 9),
                title,
                message,
                timestamp: Date.now(),
            };

            setNotifications(prev => [...prev, newNotification]);

            setTimeout(() => {
                setNotifications(prev =>
                    prev.filter(notification => notification.id !== newNotification.id)
                );
            }, 30000);
        });

        return () => {
            socket.off('message');
        };
    }, [socket]);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:w-96 z-50 flex flex-col gap-2">
            {notifications.map((notification) => (
                <div
                    data-testid="notification"
                    key={notification.id}
                    className="w-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 ease-in-out animate-slide-in"
                >
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {notification.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
                                {notification.message}
                            </p>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
