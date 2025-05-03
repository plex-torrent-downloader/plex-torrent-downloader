import { useState } from "react";
import { Link } from "@remix-run/react";

interface Props {
    torrent: {
        name: string;
        hash: string;
        fileSize: string;
        seeders: number;
        magnet?: string;
    };
    onClose: () => void;
    children?: React.ReactNode;
    collections: Array<{
        name: string;
        location: string;
    }>;
    settings: {
        fileSystemRoot: string;
    };
}

export default function AddTorrentModal(props: Props) {
    const { torrent } = props;
    const [collection, setCollection] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string|null>(null);
    const [hash, setHash] = useState<string>(props.torrent.hash);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const path: string | null = collection
        ? props.collections[parseInt(collection)].location
            .replace("[content_root]", props.settings.fileSystemRoot)
            .replace('//', '/')
        : null;

    const isButtonDisabled = !path || hash.length !== 40 || isSubmitting;

    async function submit() {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await fetch('/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hash,
                    path,
                    magnet: torrent?.magnet
                }),
            });
            setShowSuccess(true);
        } catch (e) {
            setError(e?.response?.toString() || e.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Backdrop
    const modalBackdrop = (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={isSubmitting ? undefined : props.onClose}
        />
    );

    if (error) {
        return <>
            {modalBackdrop}
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Error</h3>
                            <button
                                onClick={props.onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <h5 className="text-lg mb-6">There was an error processing this request: {error}</h5>
                        <div className="flex justify-end">
                            <button
                                onClick={() => { setError(null); }}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    }

    if (showSuccess) {
        return (
            <>
                {modalBackdrop}
                <div data-testid="success-modal" className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Success</h3>
                                <button
                                    data-testid="modal-close"
                                    onClick={props.onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                            <h5 className="text-lg mb-6">The torrent is now downloading.</h5>
                            <div className="flex justify-end">
                                <Link to="/queue">
                                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                        Open Download Queue
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {modalBackdrop}
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Start New Download</h3>
                            <button
                                onClick={isSubmitting ? undefined : props.onClose}
                                disabled={isSubmitting}
                                className={`text-gray-400 hover:text-gray-600 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <h5 className="text-lg mb-4">Please Review the following torrent download:</h5>

                        <table className="w-full mb-4">
                            <tbody className="divide-y">
                            <tr>
                                <td className="py-2 font-medium">Name</td>
                                <td className="py-2">{torrent.name.substring(0, 30)}...</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Size</td>
                                <td className="py-2">{torrent.fileSize}</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Seeders</td>
                                <td className="py-2">{torrent.seeders}</td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Infohash</td>
                                <td className="py-2">
                                    <input
                                        data-testid="torrent-hash"
                                        type="text"
                                        value={hash}
                                        onChange={(e) => setHash(e.target.value)}
                                        disabled={isSubmitting}
                                        className={`w-1/2 px-3 py-2 border rounded focus:outline-none dark:focus:ring-offset-gray-800 focus:ring-2 focus:ring-blue-500 ${
                                            isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Destination:</td>
                                <td className="py-2">
                                    <select
                                        data-testid="torrent-collection"
                                        value={collection ?? ''}
                                        onChange={(e) => setCollection(e.target.value)}
                                        disabled={isSubmitting}
                                        className={`w-1/2 px-3 py-2 border rounded focus:outline-none dark:focus:ring-offset-gray-800 focus:ring-2 focus:ring-blue-500 ${
                                            isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <option value="" disabled>Select an Option</option>
                                        {props.collections?.map((collection, index) => (
                                            <option key={index} value={index}>
                                                {collection.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 font-medium">Path:</td>
                                <td className="py-2">{path}</td>
                            </tr>
                            </tbody>
                        </table>

                        <pre className="w-full break-words whitespace-pre-wrap border rounded p-4 bg-gray-50 mb-6">
                          {torrent.name}
                        </pre>

                        <div className="flex justify-end">
                            <button
                                data-testid="torrent-start-download"
                                onClick={submit}
                                disabled={isButtonDisabled}
                                className={`px-4 py-2 rounded transition-colors flex items-center ${
                                    isButtonDisabled
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Start Download'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
