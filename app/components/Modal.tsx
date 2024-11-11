import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Button {
    label: string;
    action: () => any;
    class?: string;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface Props {
    title: string;
    disabled?: boolean;
    onClose: () => any;
    buttons?: Button[];
    children?: React.ReactNode;
}

export default function Modal({ title, disabled, onClose, buttons, children }: Props) {
    // Handle escape key press
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Prevent scroll on mount
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Helper function to get button styles based on variant
    const getButtonStyles = (button: Button) => {
        if (button.class) return button.class;

        const baseStyles = "inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto";

        switch (button.variant) {
            case 'primary':
                return `${baseStyles} border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
            case 'danger':
                return `${baseStyles} border border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
            case 'secondary':
            default:
                return `${baseStyles} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500`;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity z-40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all max-w-lg mx-auto">
                        {/* Header */}
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-start justify-between">
                                <h3
                                    className="text-lg font-medium leading-6 text-gray-900"
                                    id="modal-title"
                                >
                                    {title}
                                </h3>
                                <button
                                    type="button"
                                    className="ml-3 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 py-4 sm:px-6">
                            {children}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-4 sm:px-6">
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={getButtonStyles({ label: 'Close', action: () => {}, variant: 'secondary' })}
                                >
                                    Close
                                </button>
                                {buttons?.map((button) => (
                                    <button
                                        key={button.label}
                                        type="button"
                                        onClick={button.action}
                                        disabled={disabled}
                                        className={getButtonStyles(button)}
                                    >
                                        {button.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
