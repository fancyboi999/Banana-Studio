import { Image as ImageIcon, Wand2, Loader2, History } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { LayerList } from './LayerList';

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

interface CanvasProps {
    image: string | null;
    mode: 'edit' | 'generate';
    isLoading?: boolean;
    activeTool: string;
    selectedLayerId: string | null;
    layers: Layer[];
    onLayerSelect: (id: string) => void;
    onLayerVisibilityToggle: (id: string) => void;
    showCropper: boolean;
    cropperImage: string | null;
    crop: { x: number; y: number };
    zoom: number;
    aspect: number | undefined;
    onCropChange: (crop: { x: number; y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    isSegmenting: boolean;
    setMode: (mode: 'edit' | 'generate') => void;
    model: 'nanobanana' | 'nanobanana-pro';
    setModel: (model: 'nanobanana' | 'nanobanana-pro') => void;
    history: any[];
    onHistoryItemClick?: (item: any) => void;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
}

export function Canvas({
    image,
    mode,
    isLoading,
    activeTool,
    selectedLayerId,
    layers,
    onLayerSelect,
    onLayerVisibilityToggle,
    showCropper,
    cropperImage,
    crop,
    zoom,
    aspect,
    onCropChange,
    onZoomChange,
    onCropComplete,
    isSegmenting,
    setMode,
    model,
    setModel,
    history,
    onHistoryItemClick,
    onAddLayer,
    onDeleteLayer
}: CanvasProps) {
    const t = useTranslations();

    // Determine overlapping styles for the base image
    const isSegmentSelected = selectedLayerId?.startsWith('segment');

    return (
        <section className="flex flex-col flex-1 bg-white overflow-hidden h-full">
            {/* Options Bar */}
            <div className="options-bar flex items-center justify-between px-8 py-4 bg-[var(--color-brand-beige)] border-b-3 border-black z-20">
                <div>
                    <p className="m-0 text-[20px] font-black text-black tracking-[-0.5px] uppercase">
                        {image ? 'canvas.png' : t('Canvas.untitled')}
                    </p>
                    <span className="text-[13px] text-black font-bold opacity-70">
                        {mode === 'edit' ? t('Canvas.editSession') : t('Canvas.generateSession')}
                    </span>
                </div>

                <div className="flex gap-2 bg-white p-1.5 rounded-lg border-2 border-black shadow-hard-md">
                    <button
                        className={clsx(
                            "flex items-center gap-1.5 px-4 py-2 rounded-md border-2 border-transparent cursor-pointer text-sm font-bold transition-all",
                            mode === 'edit'
                                ? "bg-black text-white shadow-[2px_2px_0px_#a78bfa] border-black hover:bg-black hover:text-white"
                                : "bg-transparent text-black hover:bg-gray-100 hover:shadow-hard-md"
                        )}
                        onClick={() => setMode('edit')}
                        type="button"
                    >
                        <ImageIcon size={16} />
                        {t('Canvas.edit')}
                    </button>
                    <button
                        className={clsx(
                            "flex items-center gap-1.5 px-4 py-2 rounded-md border-2 border-transparent cursor-pointer text-sm font-bold transition-all",
                            mode === 'generate'
                                ? "bg-black text-white shadow-[2px_2px_0px_#a78bfa] border-black hover:bg-black hover:text-white"
                                : "bg-transparent text-black hover:bg-gray-100 hover:shadow-hard-md"
                        )}
                        onClick={() => setMode('generate')}
                        type="button"
                    >
                        <Wand2 size={16} />
                        {t('Canvas.generate')}
                    </button>
                </div>

                <div className="flex gap-1.5 bg-white p-1.5 rounded-lg border-2 border-black shadow-hard-md">
                    <button
                        className={clsx(
                            "flex flex-col items-start px-3 py-1.5 rounded-md border-2 border-transparent cursor-pointer text-xs font-bold transition-all min-w-[140px]",
                            model === 'nanobanana'
                                ? "bg-black text-white shadow-[2px_2px_0px_#a78bfa] border-black"
                                : "bg-transparent text-black hover:bg-gray-100 hover:shadow-hard-md"
                        )}
                        onClick={() => setModel('nanobanana')}
                        type="button"
                    >
                        <span className="whitespace-nowrap">Nanobanana</span>
                        <span className="text-[9px] font-normal opacity-60">GEMINI 2.5 FLASH</span>
                    </button>
                    <button
                        className={clsx(
                            "flex flex-col items-start px-3 py-1.5 rounded-md border-2 border-transparent cursor-pointer text-xs font-bold transition-all min-w-[140px]",
                            model === 'nanobanana-pro'
                                ? "bg-black text-white shadow-[2px_2px_0px_#a78bfa] border-black"
                                : "bg-transparent text-black hover:bg-gray-100 hover:shadow-hard-md"
                        )}
                        onClick={() => setModel('nanobanana-pro')}
                        type="button"
                    >
                        <span className="whitespace-nowrap">Nanobanana Pro</span>
                        <span className="text-[9px] font-normal opacity-60">GEMINI 3 PRO</span>
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 grid grid-cols-[minmax(0,1fr)_320px] overflow-hidden gap-0 bg-[var(--color-brand-bg)] h-full">
                <div className="bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center p-10 relative border-r-3 border-black">
                    {!image ? (
                        <div className="flex flex-col items-center gap-5 text-center text-black">
                            {mode === 'edit' ? (
                                <>
                                    <ImageIcon size={64} className="text-violet-400 drop-shadow-[3px_3px_0px_#000]" />
                                    <p className="text-2xl font-black m-0 tracking-tighter uppercase">{t('HomePage.editWithAI')}</p>
                                    <span className="text-sm font-bold bg-violet-200 px-3 py-1 border-2 border-black rounded-md">{t('Canvas.supports')}</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 size={64} className="text-violet-400 drop-shadow-[3px_3px_0px_#000]" />
                                    <p className="text-2xl font-black m-0 tracking-tighter uppercase">{t('HomePage.subtitle')}</p>
                                    <span className="text-sm font-bold bg-violet-200 px-3 py-1 border-2 border-black rounded-md">{t('Canvas.pressToGenerate')}</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={clsx(
                            "relative max-w-full max-h-full flex items-center justify-center p-5 rounded-xl bg-white shadow-hard-xl border-3 border-black",
                            showCropper && "overflow-hidden"
                        )}>
                            {showCropper && cropperImage ? (
                                <div className="relative w-[min(90vw,900px)] h-[min(65vh,520px)] rounded border-2 border-black">
                                    <Cropper
                                        image={cropperImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={aspect}
                                        onCropChange={onCropChange}
                                        onZoomChange={onZoomChange}
                                        onCropComplete={onCropComplete}
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Base Image */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={image}
                                        alt="Base"
                                        className="max-w-full max-h-[calc(100vh-200px)] rounded border-2 border-black block transition-opacity duration-200"
                                        style={{ opacity: isSegmentSelected ? 0.7 : 1 }}
                                    />

                                    {/* Segmentation Overlay */}
                                    {layers.filter(l => l.visible && l.preview).map((layer) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={layer.id}
                                            src={layer.preview!}
                                            alt={layer.name}
                                            className="absolute top-0 left-0 w-full h-full transition-all duration-200"
                                            style={{
                                                pointerEvents: activeTool === 'select' || activeTool === 'magic' ? 'auto' : 'none',
                                                opacity: selectedLayerId === layer.id ? 1 : 0.6,
                                                filter: selectedLayerId === layer.id ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' : 'none',
                                                zIndex: selectedLayerId === layer.id ? 5 : 1
                                            }}
                                            onClick={() => onLayerSelect(layer.id)}
                                        />
                                    ))}

                                    {/* Selection Box */}
                                    {(() => {
                                        const activeLayer = layers.find(l => l.id === selectedLayerId);
                                        if (activeLayer?.bbox) {
                                            return (
                                                <div
                                                    className="absolute border-2 border-amber-400 bg-amber-400/20 pointer-events-none z-10 box-border shadow-[0_0_0_1px_rgba(0,0,0,1)]"
                                                    style={{
                                                        left: `${activeLayer.bbox.x}%`,
                                                        top: `${activeLayer.bbox.y}%`,
                                                        width: `${activeLayer.bbox.width}%`,
                                                        height: `${activeLayer.bbox.height}%`,
                                                    }}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {isSegmenting && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm z-50 rounded">
                                            <Loader2 className="animate-spin mb-2" size={40} />
                                            <span className="font-bold text-shadow-sm">{t('Canvas.segmenting')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel (Stack Panels - Layer List + History) */}
                <div className="stack-panels flex flex-col gap-4 p-5 overflow-y-auto bg-white border-l-3 border-black">
                    <LayerList
                        layers={layers}
                        selectedLayerId={selectedLayerId}
                        onLayerSelect={onLayerSelect}
                        onLayerVisibilityToggle={onLayerVisibilityToggle}
                        onAddLayer={onAddLayer}
                        onDeleteLayer={onDeleteLayer}
                    />

                    {/* History Panel */}
                    <div className="bg-amber-100 rounded-xl p-5 border-2 border-black shadow-hard-lg">
                        <div className="flex items-center gap-2.5 mb-4 text-black font-extrabold uppercase text-sm">
                            <History size={16} />
                            <span>{t('Canvas.history')}</span>
                        </div>
                        <ul className="list-none p-0 m-0 flex flex-col gap-2">
                            {history.map((item, idx) => {
                                const isString = typeof item === 'string';
                                return (
                                    <li
                                        key={idx}
                                        className={clsx(
                                            "p-2 bg-white rounded-md font-bold text-xs border-2 border-black shadow-hard-sm animate-in fade-in slide-in-from-left-2 duration-300 transition-all",
                                            !isString && "cursor-pointer hover:bg-violet-50 hover:border-violet-600 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                        )}
                                        onClick={() => !isString && onHistoryItemClick?.(item)}
                                    >
                                        {isString ? item : `${item.mode === 'generate' ? t('Canvas.imageGenerated') : t('Canvas.aiEditApplied')}: ${item.prompt.substring(0, 20)}...`}
                                        {!isString && (
                                            <div className="mt-1 text-[9px] opacity-40 font-normal">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
