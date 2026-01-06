import { useRef } from 'react';
import { Upload, X, Loader2, Download } from 'lucide-react';
import clsx from 'clsx';
import { filterPresets } from '@/lib/constants';
import { useTranslations } from 'next-intl';

interface ControlPanelProps {
    mode: 'edit' | 'generate';
    prompt: string;
    negativePrompt: string;
    onPromptChange: (value: string) => void;
    onNegativePromptChange: (value: string) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearImage: () => void;
    image: string | null;
    isLoading: boolean;
    aspect: number | undefined;
    onAspectChange: (ratio: number | undefined) => void;
    activeTool: string;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    onCancelCrop: () => void;
    onApplyCrop: () => void;
    onResetCrop: () => void;
    canApplyCrop: boolean;
    onProcess: () => void;
    onDownload: () => void;
    editedImage: string | null;
    onApplyFilter?: (prompt: string) => void;
}

export function ControlPanel({
    mode,
    prompt,
    negativePrompt,
    onPromptChange,
    onNegativePromptChange,
    onImageUpload,
    onClearImage,
    image,
    isLoading,
    aspect,
    onAspectChange,
    activeTool,
    zoom,
    onZoomChange,

    onCancelCrop,
    onApplyCrop,
    onResetCrop,
    canApplyCrop,
    onProcess,
    onDownload,
    editedImage,
    onApplyFilter
}: ControlPanelProps) {
    const t = useTranslations('ControlPanel');
    const tFilter = useTranslations('Filter');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const aspectPresets = [
        { label: t('free'), ratio: undefined },
        { label: '1:1', ratio: 1 },
        { label: '4:5', ratio: 4 / 5 },
        { label: '3:2', ratio: 3 / 2 },
        { label: '16:9', ratio: 16 / 9 },
    ];

    return (
        <aside className="p-5 overflow-y-auto bg-white flex flex-col gap-5 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-black h-full">
            <div className="bg-white rounded-xl p-5 border-2 border-black shadow-hard-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black uppercase text-black tracking-tighter">
                        {activeTool === 'filters' ? t('photoFilters') : (mode === 'edit' ? t('editControls') : t('generationControls'))}
                    </h2>
                </div>

                {activeTool === 'filters' && (
                    <div className="flex flex-col">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {filterPresets.map((filter) => (
                                <button
                                    key={filter.label}
                                    type="button"
                                    className="border-2 border-black bg-white text-black p-3 rounded-lg text-center transition-all hover:bg-violet-100 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000000] cursor-pointer shadow-[3px_3px_0px_#000000]"
                                    onClick={() => onApplyFilter?.(filter.prompt)}
                                    title={tFilter(filter.id as any)}
                                >
                                    <div className="text-xs font-extrabold uppercase mb-1">{tFilter(filter.id as any)}</div>
                                    <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase bg-gray-200 px-1.5 py-0.5 rounded border border-black inline-block">{tFilter(`Category.${filter.category}` as any)}</div>
                                </button>
                            ))}
                        </div>
                        <div className="bg-amber-100 border-2 border-black p-3 rounded-lg shadow-[3px_3px_0px_#000000]">
                            <p className="text-xs font-bold text-black m-0">
                                {tFilter('details')}
                            </p>
                        </div>
                    </div>
                )}

                {activeTool !== 'filters' && mode === 'edit' && (
                    <div className="flex flex-col gap-3 mb-5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={onImageUpload}
                            className="hidden"
                            id="file-input"
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="file-input"
                            className={clsx(
                                "flex items-center justify-center gap-2.5 px-5 py-4 rounded-lg border-2 border-dashed border-black bg-gray-100 text-black cursor-pointer font-extrabold text-sm uppercase transition-all",
                                isLoading && "opacity-50 cursor-not-allowed",
                                !isLoading && "hover:bg-indigo-50 hover:border-violet-600 hover:border-solid hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
                            )}
                        >
                            <Upload size={20} />
                            {image ? t('replaceAsset') : t('importImage')}
                        </label>
                        {image && (
                            <button
                                className="flex items-center justify-center gap-2.5 px-5 py-4 rounded-lg border-2 border-black bg-red-100 text-black cursor-pointer font-extrabold text-sm uppercase transition-all hover:bg-red-500 hover:text-white"
                                onClick={onClearImage}
                                disabled={isLoading}
                                type="button"
                            >
                                <X size={16} />
                                {t('removeLayer')}
                            </button>
                        )}
                    </div>
                )}

                {activeTool !== 'filters' && (
                    <>
                        <div className="flex flex-col gap-2.5 mb-5">
                            <div className="flex justify-between text-xs font-extrabold uppercase text-black">
                                <label htmlFor="prompt">
                                    {mode === 'edit' ? t('editingPrompt') : t('generationPrompt')}
                                </label>
                                <span className="text-violet-600">{prompt.length}/2000</span>
                            </div>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                placeholder={
                                    mode === 'edit'
                                        ? t('editingPromptPlaceholder')
                                        : t('generationPromptPlaceholder')
                                }
                                rows={5}
                                className="w-full p-4 rounded-lg border-2 border-black bg-white text-black resize-none text-base font-semibold shadow-hard-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                                disabled={isLoading}
                                maxLength={2000}
                            />
                        </div>

                        <div className="flex flex-col gap-2.5 mb-5">
                            <label htmlFor="negative-prompt" className="text-xs font-extrabold uppercase text-black">{t('negativePrompt')}</label>
                            <textarea
                                id="negative-prompt"
                                value={negativePrompt}
                                onChange={(e) => onNegativePromptChange(e.target.value)}
                                placeholder={t('negativePromptPlaceholder')}
                                rows={3}
                                className="w-full p-4 rounded-lg border-2 border-black bg-white text-black resize-none text-base font-semibold shadow-hard-md focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>
                    </>
                )}

                {activeTool !== 'filters' && (
                    <button
                        onClick={onProcess}
                        disabled={isLoading || !prompt}
                        className={clsx(
                            "w-full py-4 text-xs font-black uppercase tracking-wider bg-black text-white rounded-lg transition-all shadow-[4px_4px_0px_#a78bfa] flex justify-center items-center gap-2",
                            (isLoading || !prompt) ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_#a78bfa]"
                        )}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                        {isLoading ? t('processing') : (mode === 'generate' ? t('runGenerate') : t('runEdit'))}
                    </button>
                )}

                {activeTool === 'crop' && image && (
                    <div className="mt-5 pt-5 border-t-2 border-dashed border-gray-300">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-sm">{t('cropControls')}</p>
                                <span className="text-xs text-gray-500">{t('cropInstructions')}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {aspectPresets.map((preset) => {
                                const isActive = preset.ratio ? aspect === preset.ratio : !aspect;
                                return (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-bold border-2 border-black rounded-md transition-all",
                                            isActive ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                                        )}
                                        onClick={() => onAspectChange(preset.ratio)}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                        <label className="block text-xs font-bold uppercase mb-2" htmlFor="crop-zoom">
                            {t('zoom')}
                        </label>
                        <input
                            id="crop-zoom"
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full mb-4 accent-black"
                        />
                        <div className="flex gap-2">
                            <button
                                className="flex-1 px-4 py-2 border-2 border-black bg-red-100 text-black font-bold uppercase text-xs rounded-md hover:bg-red-200"
                                type="button"
                                onClick={onCancelCrop}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="flex-1 px-4 py-2 border-2 border-black bg-white text-black font-bold uppercase text-xs rounded-md hover:bg-gray-100"
                                type="button"
                                onClick={onResetCrop}
                            >
                                {t('reset')}
                            </button>
                            <button
                                className="flex-1 px-4 py-2 border-2 border-black bg-emerald-400 text-black font-bold uppercase text-xs rounded-md hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-hard-sm"
                                type="button"
                                onClick={onApplyCrop}
                                disabled={!canApplyCrop}
                            >
                                {t('applyCrop')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {editedImage && activeTool !== 'crop' && (
                <div className="bg-white rounded-xl overflow-hidden border-2 border-black shadow-hard-lg">
                    <div className="p-3 bg-[var(--color-brand-beige)] border-b-2 border-black">
                        <h3 className="font-bold text-sm uppercase text-black m-0">{t('outputActions')}</h3>
                    </div>
                    <div className="p-5">
                        <button
                            onClick={onDownload}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 border-2 border-black text-black font-black uppercase text-xs rounded-lg shadow-hard-md hover:-translate-y-0.5 hover:shadow-hard-lg transition-all"
                            type="button"
                        >
                            <Download size={16} />
                            {t('exportPng')}
                        </button>
                        <button
                            onClick={onResetCrop} // Reusing onResetCrop which resets to original
                            className="w-full flex items-center justify-center gap-2 py-3 mt-3 bg-white border-2 border-black text-black font-black uppercase text-xs rounded-lg shadow-hard-md hover:-translate-y-0.5 hover:shadow-hard-lg transition-all hover:bg-gray-100"
                            type="button"
                        >
                            {t('resetToOriginal')}
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
