import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    type?: 'default' | 'danger' | 'warning' | 'success';
}

export function Modal({ isOpen, onClose, title, children, footer, type = 'default' }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={clsx(
                    "w-full max-w-md bg-white border-3 border-black shadow-[8px_8px_0px_#000] relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
                    type === 'danger' && "border-red-600",
                    type === 'warning' && "border-amber-500"
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className={clsx(
                    "flex items-center justify-between px-5 py-3 border-b-3 border-black",
                    type === 'danger' ? "bg-red-100" :
                        type === 'warning' ? "bg-amber-100" :
                            "bg-violet-100"
                )}>
                    <h3 className="text-lg font-black uppercase tracking-tight truncate pr-4">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-5 py-4 border-t-3 border-black bg-gray-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
