// GenericTorrent.tsx
import { useState } from "react";
import Modal from "~/components/Modal";
import { Moment } from "moment";
import { Download, Upload, Users, HardDrive, Clock } from 'lucide-react';

export interface Action {
    name: string;
    action: () => any;
    className?: string;
    variant?: 'primary' | 'success' | 'danger';
}

export interface Props {
    name: string;
    status?: string;
    seeders?: number;
    leechers?: number;
    downloadSpeed?: number;
    timestamp?: Moment;
    uploadSpeed?: number;
    variant?: 'default' | 'success' | 'search';
    progress?: number;
    isSearchResult: boolean;
    peers?: number;
    size?: string;
    actions: Action[];
}

function formatBytes(bytes: number): string {
    if (!bytes) return '0 Byte';
    if (bytes === 1) return '1 Byte';

    if (bytes >= 0x40000000) {
        const gb = (bytes / 0x40000000).toFixed(1);
        return `${gb}GB`;
    } else if (bytes >= 0x100000) {
        const mb = (bytes / 0x100000).toFixed(1);
        return `${mb}MB`;
    } else if (bytes >= 0x400) {
        const kb = (bytes / 0x400).toFixed(1);
        return `${kb}KB`;
    }
    return `${bytes} Bytes`;
}

export default function GenericTorrent(props: Props) {
    const {
        name = '',
        status,
        seeders,
        progress,
        downloadSpeed,
        uploadSpeed,
        peers,
        actions,
        size,
        isSearchResult,
        variant = 'default',
        timestamp
    } = props;

    const [showModal, setShowModal] = useState<boolean>(false);

    async function click() {
        if (actions.length === 1) {
            actions[0].action();
            return;
        }
        setShowModal(true);
    }

    const getButtonStyles = (action: Action) => {
        if (action.className) return action.className;

        const baseStyles = "w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md dark:focus:ring-offset-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";

        switch (action.variant) {
            case 'success':
                return `${baseStyles} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:focus:ring-offset-gray-800`;
            case 'danger':
                return `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:focus:ring-offset-gray-800`;
            default:
                return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:focus:ring-offset-gray-800`;
        }
    };

    const getVariantStyles = () => {
        const baseStyles = "relative overflow-hidden rounded-lg shadow-sm transition-all duration-200 hover:shadow-md";

        switch (variant) {
            case 'success':
                return `${baseStyles} bg-gradient-to-r from-green-500 to-emerald-600`;
            case 'search':
                return `${baseStyles} bg-gradient-to-r from-blue-500 to-indigo-600`;
            default:
                return `${baseStyles} bg-gradient-to-r from-blue-600 to-blue-700`;
        }
    };

    return (
        <>
            {showModal && (
                <Modal
                    title="Torrent Actions"
                    onClose={() => setShowModal(false)}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-gray-900">{name}</h3>
                            {status && <p className="text-sm text-gray-500">{status}</p>}
                        </div>

                        <div className="space-y-2">
                            {actions.map((action, index) => (
                                <button
                                    data-testid={"torrent-action" + action.name}
                                    key={index}
                                    onClick={() => {
                                        action.action();
                                        setShowModal(false);
                                    }}
                                    className={getButtonStyles(action)}
                                >
                                    {action.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            <div
                data-testid="torrent"
                className={`${getVariantStyles()} cursor-pointer group hover:scale-[1.01]`}
                onClick={click}
            >
                {/* Progress Bar */}
                {!isNaN(progress) && (
                    <div
                        className="absolute inset-0 bg-green-500/30 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                )}

                {/* Content */}
                <div className="relative z-10 p-4 text-white">
                    {/* Title */}
                    <h3 className="font-medium truncate mb-2">
                        {name}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            {status && (
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 opacity-75" />
                                    <span>{status}</span>
                                </div>
                            )}
                            {peers > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 opacity-75" />
                                    <span>{peers} Peers</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            {size && (
                                <div className="flex items-center space-x-2">
                                    <HardDrive className="h-4 w-4 opacity-75" />
                                    <span>{size}</span>
                                </div>
                            )}
                            {downloadSpeed > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Download className="h-4 w-4 opacity-75" />
                                    <span>{formatBytes(downloadSpeed)}/s</span>
                                </div>
                            )}
                            {uploadSpeed > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Upload className="h-4 w-4 opacity-75" />
                                    <span>{formatBytes(uploadSpeed)}/s</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timestamp */}
                    {timestamp && (
                        <div className="absolute bottom-2 right-2 text-xs opacity-75">
                            {timestamp.fromNow()}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

