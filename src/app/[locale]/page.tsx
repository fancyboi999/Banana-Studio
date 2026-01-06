'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { generateImageAction, editImageAction, segmentImageAction, fetchHistoryAction } from '@/app/actions/gemini';
import { loadImageElement, createMaskedPreview, extractBoundingBox, getCroppedImage } from '@/lib/imageUtils';
import { useModal } from '@/context/ModalContext';

// Components
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ControlPanel } from '@/components/studio/ControlPanel';
import { Canvas } from '@/components/studio/Canvas';

type Mode = 'edit' | 'generate';
type Model = 'nanobanana' | 'nanobanana-pro';

interface Layer {
    id: string;
    name: string;
    kind: 'segment' | 'source' | 'ai' | 'empty';
    preview: string | null;
    originalPreview?: string;
    visible: boolean;
    bbox?: { x: number; y: number; width: number; height: number } | null;
    metadata?: {
        maskUrl?: string;
        originalBaseImage?: string; // Track which base image this layer belongs to
    };
}

export default function Index() {
    const t = useTranslations();
    const { showAlert } = useModal();
    const [mode, setMode] = useState<Mode>('edit');
    const [model, setModel] = useState<Model>('nanobanana');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState('select');
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [adjustmentCount, setAdjustmentCount] = useState(1);

    // Cropper State
    const [showCropper, setShowCropper] = useState(false);
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null); // Type 'Area' from react-easy-crop if imported

    // Real History State
    const [realHistory, setRealHistory] = useState<any[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            const res = await fetchHistoryAction();
            if (res.success && res.data) {
                setRealHistory(res.data);
            }
        };
        loadHistory();
    }, []);

    // History Tracking UI
    const historyEntries = [
        t('Canvas.sessionStarted'),
        ...realHistory
    ];

    const handleHistoryItemClick = (item: any) => {
        const imageUrl = `/generate_images/${item.image_name}`;
        setImage(imageUrl);
        setOriginalImage(imageUrl); // Set as new original so "Reset" reverts to this history state
        setEditedImage(imageUrl);
        setPrompt(item.prompt);
        setNegativePrompt(item.negative_prompt || '');
        setMode(item.mode);
        setModel(item.model);
        // Restore layers if available (Plan B)
        if (item.layers) {
            try {
                const savedLayers = JSON.parse(item.layers);
                setLayers(savedLayers);
                if (savedLayers.length > 0) {
                    setSelectedLayerId(savedLayers[0].id);
                }
            } catch (e) {
                console.error("Failed to parse history layers:", e);
                setLayers([]);
            }
        } else {
            // Fallback for old history: clear layers
            setLayers([]);
            setSelectedLayerId(null);
        }
    };


    // Menu Handler
    const handleMenuClick = (menuItem: string) => {
        switch (menuItem) {

            case 'Help':
                window.open('https://github.com/fancyboi999/Banana-Studio', '_blank');
                break;
            default:
                break;
        }
    };

    const handleDownload = () => {
        const targetImage = editedImage || image;
        if (targetImage) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `nanobanana-${mode}-${timestamp}.png`;
            const link = document.createElement('a');
            link.href = targetImage;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleProcess = async () => {
        if (!prompt) return;
        setIsLoading(true);
        try {
            let result;
            let activeLayer: Layer | undefined;
            let maskImage: string | undefined;

            if (mode === 'edit') {
                activeLayer = layers.find(l => l.id === selectedLayerId);

                // Smart Context Logic:
                // 1. If we are editing a "Segment" layer -> We use Inpainting (Base Image + Mask)
                // 2. If we are editing "Source" or "AI" layer -> We use Image-to-Image (Layer Preview)

                let sourceImage = image || '';

                if (activeLayer?.kind === 'segment') {
                    console.log('[Edit] Context Mode: Inpainting (Base + Segment Mask)');
                    // Use the original base image (already set to sourceImage)
                    // Use the mask from the layer
                    if (activeLayer.metadata?.maskUrl) {
                        maskImage = activeLayer.metadata.maskUrl;
                    } else {
                        console.warn('[Edit] Segment layer missing maskUrl, falling back to cropped preview');
                        sourceImage = activeLayer.preview || '';
                    }
                } else if (activeLayer) {
                    console.log('[Edit] Context Mode: Direct Layer Edit');
                    // Use the layer's own preview as the source
                    sourceImage = activeLayer.preview || image || '';
                }

                // Ensure image isn't null/empty before calling
                if (!sourceImage) {
                    showAlert({ title: 'Upload Required', message: 'Please upload an image first', type: 'warning' });
                    setIsLoading(false);
                    return;
                }

                // Serialize layers for persistence (Plan B)
                // We pass the CURRENT layers state including the potential modification we are about to make? 
                // Actually, the action makes the modification. We should pass the current state, 
                // and ideally the action would update it, but here we update state client-side.
                // We'll pass the current layers to save in history. 
                // Note: If we are modifying a layer, the history will save the PRE-modification state of other layers?
                // Ideally we save the POST-modification state.
                // But we can't get the result before calling action.
                // Compromise: We pass the current layers. (Or we trigger a DB update after result? No, action handles DB).
                // Let's pass current layers.

                result = await editImageAction(sourceImage, prompt, negativePrompt, maskImage, model, JSON.stringify(layers));
            } else {
                result = await generateImageAction(prompt, negativePrompt, model, JSON.stringify(layers));
            }

            if (result.success && result.image) {
                // If we were doing a localized edit (Inpainting on a layer), update ONLY that layer
                if (activeLayer?.kind === 'segment' && maskImage) {
                    setLayers(prev => prev.map(l =>
                        l.id === selectedLayerId
                            ? { ...l, preview: result.image }
                            : l
                    ));
                    // Optional: Update editedImage to reflect the change visually if it's the active view, 
                    // but the Canvas renders layers on top, so updating the layer preview is sufficient.
                } else {
                    // Global edit
                    setEditedImage(result.image);
                    setImage(result.image); // FORCE UPDATE base image so Canvas and Tools work on new version

                    // Also update main image if in generate mode (already covered by above, but keeping explicit logic)
                    if (mode === 'generate') {
                        setOriginalImage(result.image);
                    }
                }

                // Refresh history from DB after successful action
                const historyRes = await fetchHistoryAction();
                if (historyRes.success && historyRes.data) {
                    setRealHistory(historyRes.data);
                }
            } else if (result.error) {
                showAlert({ title: 'Error', message: `Error: ${result.error}`, type: 'danger' });
            }
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Error', message: `Error: ${err}`, type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setImage(dataUrl);
                setOriginalImage(dataUrl);
                // Clear all layers when a new image is uploaded
                setLayers([]);
                setSelectedLayerId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const processMasks = async (baseImageUrl: string, maskUrls: string[]) => {
        try {
            const baseImg = await loadImageElement(baseImageUrl);
            const newLayers: Layer[] = [];

            for (let i = 0; i < maskUrls.length; i++) {
                const maskImg = await loadImageElement(maskUrls[i]);
                const preview = createMaskedPreview(baseImg, maskImg);
                const bbox = await extractBoundingBox(preview);

                newLayers.push({
                    id: `segment-${Date.now()}-${i}`,
                    name: `Object ${i + 1}`,
                    kind: 'segment',
                    preview: preview,
                    originalPreview: preview,
                    visible: true,
                    bbox: bbox,
                    metadata: {
                        maskUrl: maskUrls[i],
                        originalBaseImage: baseImageUrl
                    }
                });
            }

            setLayers(prev => [...newLayers, ...prev]);
            if (newLayers.length > 0) setSelectedLayerId(newLayers[0].id);
        } catch (err) {
            console.error('Failed to process masks:', err);
        }
    };

    const handleToolSelect = (toolId: string) => {
        setActiveTool(toolId);

        if (toolId === 'crop') {
            if (selectedLayerId) {
                const layer = layers.find(l => l.id === selectedLayerId);
                if (layer) setCropperImage(layer.originalPreview || layer.preview);
            } else if (image) {
                setCropperImage(originalImage || image);
            }
            if (image) setShowCropper(true);
        } else {
            setShowCropper(false);
        }

        if (toolId === 'magic' && image) {
            console.log('[Magic] Calling Replicate SAM-2...');
            setIsLoading(true);
            segmentImageAction(image).then(result => {
                setIsLoading(false);
                if (result.success) {
                    console.log('[Magic] Success! Received masks count:', result.data?.individual_masks?.length);
                    const maskUrls = result.data?.individual_masks || [];
                    if (maskUrls.length > 0) {
                        processMasks(image, maskUrls);
                    } else {
                        console.warn('[Magic] No masks found in response');
                    }
                } else {
                    showAlert({ title: 'Segmentation Failed', message: 'Segmentation failed: ' + result.error, type: 'danger' });
                }
            });
        }
    };

    // Crop Handlers
    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    // This would need a proper implementation of getCroppedImg
    const handleApplyCrop = async () => {
        if (!croppedAreaPixels || !cropperImage) return;

        try {
            const croppedDataUrl = await getCroppedImage(cropperImage, croppedAreaPixels);

            // If a specific layer was selected, update it
            if (selectedLayerId) {
                setLayers(prev => prev.map(l => {
                    if (l.id === selectedLayerId) {
                        return { ...l, preview: croppedDataUrl };
                    }
                    return l;
                }));
            }
            // Otherwise, assumes we are cropping the base image
            else {
                setImage(croppedDataUrl);
                // Clear segment layers as they are likely invalid for the new crop
                setLayers(prev => prev.filter(l => l.kind !== 'segment'));
                // If editedImage was active, update it too
                setEditedImage(croppedDataUrl);
            }

            setShowCropper(false);
            setActiveTool('select');
            setCropperImage(null);
        } catch (e) {
            console.error('Failed to crop:', e);
        }
    };

    const handleApplyFilter = async (filterPrompt: string) => {
        if (!image) {
            showAlert({ title: 'Upload Required', message: 'Please upload an image first', type: 'warning' });
            return;
        }

        setIsLoading(true);
        setPrompt(filterPrompt);

        try {
            // Ensure we are in edit mode
            if (mode !== 'edit') setMode('edit');

            // Use active layer if available, otherwise base image
            const activeLayer = layers.find(l => l.id === selectedLayerId);
            const sourceImage = activeLayer?.preview || image || '';

            const result = await editImageAction(sourceImage, filterPrompt, negativePrompt, undefined, model);

            if (result.success && result.image) {
                setEditedImage(result.image);
                // Refresh history from DB after successful action
                const historyRes = await fetchHistoryAction();
                if (historyRes.success && historyRes.data) {
                    setRealHistory(historyRes.data);
                }
            } else if (result.error) {
                showAlert({ title: 'Error', message: `Error: ${result.error}`, type: 'danger' });
            }
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Error', message: `Error: ${err}`, type: 'danger' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLayer = () => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: `Adjustment ${adjustmentCount}`,
            kind: 'empty',
            preview: null,
            visible: true
        };

        setLayers(prev => [newLayer, ...prev]);
        setSelectedLayerId(newLayer.id);
        setAdjustmentCount(prev => prev + 1);
    };

    const handleDeleteLayer = (id: string) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== id);
            // If we deleted the selected layer, select the first one or null
            if (selectedLayerId === id) {
                // We're inside setState updater, so we can't reliably read newLayers immediately for another setState 
                // BUT we are setting 'layers' here. 
                // We should sync selectedLayerId in a useEffect or here if possible. 
                // Actually, let's do logic outside setState for selection update.
                return newLayers;
            }
            return newLayers;
        });

        if (selectedLayerId === id) {
            // We need to calculate what the next selection should be. 
            // Since state update is async, we can do it on the current 'layers'
            const filtered = layers.filter(l => l.id !== id);
            setSelectedLayerId(filtered.length > 0 ? filtered[0].id : null);
        }
    };

    return (
        <div className="app-layout">
            <Header
                onMenuClick={handleMenuClick}
                onQuickEditValues={(p) => setPrompt(p)}
                isLoading={isLoading}
            />

            <div className="workspace-grid">
                <div className="sidebar-area">
                    <Sidebar
                        activeTool={activeTool}
                        onToolSelect={handleToolSelect}
                        canCrop={!!image}
                        isLoading={isLoading}
                    />
                </div>

                <div className="canvas-area">
                    <Canvas
                        image={editedImage || image}
                        mode={mode}
                        isLoading={isLoading}
                        activeTool={activeTool}
                        selectedLayerId={selectedLayerId}
                        layers={layers}
                        onLayerSelect={setSelectedLayerId}
                        onLayerVisibilityToggle={(id) => {
                            setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
                        }}
                        showCropper={showCropper}
                        cropperImage={cropperImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        isSegmenting={isLoading && activeTool === 'magic'}
                        setMode={setMode}
                        model={model}
                        setModel={setModel}
                        history={historyEntries}
                        onHistoryItemClick={handleHistoryItemClick}
                        onAddLayer={handleAddLayer}
                        onDeleteLayer={handleDeleteLayer}
                    />
                </div>

                <div className="controls-area">
                    <ControlPanel
                        mode={mode}
                        prompt={prompt}
                        negativePrompt={negativePrompt}
                        onPromptChange={setPrompt}
                        onNegativePromptChange={setNegativePrompt}
                        onImageUpload={handleImageUpload}
                        onClearImage={() => { setImage(null); setLayers([]); }}
                        image={image}
                        isLoading={isLoading}
                        aspect={aspect}
                        onAspectChange={setAspect}
                        activeTool={activeTool}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        onCancelCrop={() => { setShowCropper(false); setActiveTool('select'); }}
                        onApplyCrop={handleApplyCrop}
                        onResetCrop={() => {
                            if (selectedLayerId) {
                                setLayers(prev => prev.map(l => {
                                    if (l.id === selectedLayerId && l.originalPreview) {
                                        return { ...l, preview: l.originalPreview };
                                    }
                                    return l;
                                }));
                            } else if (originalImage) {
                                setImage(originalImage);
                                setEditedImage(null); // Clear editedImage to enable clean state
                                // Clear segment layers as they might be misaligned
                                setLayers(prev => prev.filter(l => l.kind !== 'segment'));
                            }
                            setShowCropper(false);
                            setActiveTool('select');
                            setCropperImage(null);
                        }}
                        canApplyCrop={!!croppedAreaPixels}
                        onProcess={handleProcess}
                        onDownload={handleDownload}
                        editedImage={editedImage}
                        onApplyFilter={handleApplyFilter}
                    />
                </div>
            </div>
        </div>
    );
}
