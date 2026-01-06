'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ModalOptions {
    title: string;
    content: ReactNode;
    type?: 'default' | 'danger' | 'warning' | 'success';
    footer?: ReactNode;
    onClose?: () => void;
}

interface AlertOptions {
    title?: string;
    message: ReactNode;
    type?: 'default' | 'danger' | 'warning' | 'success';
}

interface ConfirmOptions {
    title?: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: 'default' | 'danger' | 'warning';
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
    showAlert: (options: AlertOptions | string) => Promise<void>;
    showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modalState, setModalState] = useState<ModalOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const hideModal = useCallback(() => {
        setIsOpen(false);
        // Delay clearing state to allow animation to finish if we had one (though current impl unmounts)
        // For now, just close immediately or small timeout if needed
        setTimeout(() => setModalState(null), 200);
    }, []);

    const showModal = useCallback((options: ModalOptions) => {
        setModalState(options);
        setIsOpen(true);
    }, []);

    const showAlert = useCallback((options: AlertOptions | string) => {
        return new Promise<void>((resolve) => {
            const opts = typeof options === 'string' ? { message: options } : options;

            showModal({
                title: opts.title || 'Alert',
                content: <div className="text-base font-medium text-gray-800">{opts.message}</div>,
                type: opts.type || 'default',
                footer: (
                    <button
                        onClick={() => {
                            hideModal();
                            resolve();
                        }}
                        className="px-6 py-2 bg-black text-white font-bold uppercase rounded border-2 border-transparent hover:bg-gray-800 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        OK
                    </button>
                ),
                onClose: () => {
                    resolve();
                }
            });
        });
    }, [showModal, hideModal]);

    const showConfirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            showModal({
                title: options.title || 'Confirm',
                content: <div className="text-base font-medium text-gray-800">{options.message}</div>,
                type: options.type || 'warning',
                footer: (
                    <>
                        <button
                            onClick={() => {
                                hideModal();
                                resolve(false);
                            }}
                            className="px-4 py-2 bg-white text-black font-bold uppercase rounded border-2 border-black hover:bg-gray-100 shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                            {options.cancelText || 'Cancel'}
                        </button>
                        <button
                            onClick={() => {
                                hideModal();
                                resolve(true);
                            }}
                            className={
                                `px-4 py-2 text-white font-bold uppercase rounded border-2 border-black shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all ${options.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'
                                }`
                            }
                        >
                            {options.confirmText || 'Confirm'}
                        </button>
                    </>
                ),
                onClose: () => {
                    resolve(false);
                }
            });
        });
    }, [showModal, hideModal]);

    return (
        <ModalContext.Provider value={{ showModal, hideModal, showAlert, showConfirm }}>
            {children}
            {modalState && (
                <Modal
                    isOpen={isOpen}
                    onClose={() => {
                        if (modalState.onClose) modalState.onClose();
                        hideModal();
                    }}
                    title={modalState.title}
                    footer={modalState.footer}
                    type={modalState.type}
                >
                    {modalState.content}
                </Modal>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
