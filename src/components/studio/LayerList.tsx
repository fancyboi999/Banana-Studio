'use client';

import { Layers, Plus, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useModal } from '@/context/ModalContext';

interface Layer {
    id: string;
    name: string;
    kind: 'segment' | 'source' | 'ai' | 'empty';
    preview: string | null;
    visible: boolean;
    bbox?: { x: number; y: number; width: number; height: number } | null;
    metadata?: {
        maskUrl?: string;
    };
}

interface LayerListProps {
    layers: Layer[];
    selectedLayerId: string | null;
    onLayerSelect: (id: string) => void;
    onLayerVisibilityToggle: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
}

export function LayerList({ layers, selectedLayerId, onLayerSelect, onLayerVisibilityToggle, onAddLayer, onDeleteLayer }: LayerListProps) {
    const t = useTranslations('LayerList');
    const { showConfirm } = useModal();

    return (
        <div className="bg-[#fef3c7] rounded-xl p-5 border-2 border-black shadow-hard-md flex flex-col">
            <div className="flex items-center justify-between gap-2.5 mb-4 text-black text-sm">
                <div className="flex items-center gap-2.5 font-extrabold uppercase">
                    <Layers size={16} />
                    <span>{t('title')}</span>
                </div>
                <button
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border-2 border-black bg-white text-black text-xs font-extrabold uppercase cursor-pointer transition-all shadow-hard-sm hover:bg-violet-300 hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-md"
                    type="button"
                    onClick={onAddLayer}
                >
                    <Plus size={14} />
                    {t('newLayer')}
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {layers.length === 0 ? (
                    <div className="text-gray-500 bg-white p-3 rounded-lg text-sm border-2 border-black text-center font-bold">
                        {t('emptyState')}
                    </div>
                ) : (
                    layers.map((layer) => (
                        <div
                            key={layer.id}
                            role="button"
                            className={clsx(
                                "flex items-center justify-between gap-2 px-3 py-3 rounded-lg border-2 border-black cursor-pointer transition-all shadow-hard-sm w-full text-left",
                                selectedLayerId === layer.id
                                    ? "bg-violet-300 text-black -translate-x-px -translate-y-px shadow-hard-md"
                                    : "bg-white text-black hover:bg-amber-50 hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-md",
                                !layer.visible && "opacity-60"
                            )}
                            onClick={() => onLayerSelect(layer.id)}
                        >
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <strong className="text-sm font-extrabold truncate block">{layer.name}</strong>
                                <span className="text-[11px] font-bold opacity-70 uppercase truncate block">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className={clsx(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_#000]",
                                    layer.kind === 'source' && "bg-white",
                                    layer.kind === 'ai' && "bg-violet-400",
                                    layer.kind === 'segment' && "bg-red-300",
                                    layer.kind === 'empty' && "bg-amber-300"
                                )}>
                                    {t(`kind.${layer.kind}` as any)}
                                </span>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLayerVisibilityToggle(layer.id);
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-white border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                                    title={layer.visible ? "Hide layer" : "Show layer"}
                                >
                                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (await showConfirm({
                                            title: t('deleteLayer'),
                                            message: t('confirmDelete'),
                                            type: 'danger',
                                            confirmText: 'Delete',
                                            cancelText: 'Cancel'
                                        })) {
                                            onDeleteLayer(layer.id);
                                        }
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-red-300 border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                                    title={t('deleteLayer')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
