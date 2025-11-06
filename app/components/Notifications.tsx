import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/QueueContext';
import { X } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
}

interface TranscodeProgress {
    fileName: string;
    progress: number;
    status: 'transcoding' | 'completed';
}

export default function NotificationToasts() {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [transcodeProgress, setTranscodeProgress] = useState<TranscodeProgress | null>(null);

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

        socket.on('transcode:progress', (data: TranscodeProgress) => {
            setTranscodeProgress(data);

            // Auto-hide 3 seconds after completion
            if (data.status === 'completed') {
                setTimeout(() => {
                    setTranscodeProgress(null);
                }, 3000);
            }
        });

        return () => {
            socket.off('message');
            socket.off('transcode:progress');
        };
    }, [socket]);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    if (notifications.length === 0 && !transcodeProgress) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 left-4 lg:left-auto lg:w-96 z-50 flex flex-col gap-2">
            {/* Transcode Progress */}
            {transcodeProgress && (
                <div
                    className="w-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 ease-in-out animate-slide-in"
                >
                    <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {transcodeProgress.status === 'completed' ? 'Transcoding Complete' : 'Transcoding Video'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                                {transcodeProgress.fileName}
                            </p>
                        </div>
                        <button
                            onClick={() => setTranscodeProgress(null)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${
                                transcodeProgress.status === 'completed'
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                            }`}
                            style={{ width: `${transcodeProgress.progress}%` }}
                        />
                    </div>

                    {/* Progress Percentage */}
                    <div className="mt-2 text-right">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {transcodeProgress.progress}%
                        </span>
                    </div>
                </div>
            )}

            {/* Regular Notifications */}
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
