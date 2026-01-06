import { MousePointer2, Crop, Sparkles, Wand2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

interface SidebarProps {
    activeTool: string;
    onToolSelect: (toolId: string) => void;
    canCrop: boolean;
    isLoading?: boolean;
}

export function Sidebar({ activeTool, onToolSelect, canCrop, isLoading }: SidebarProps) {
    const t = useTranslations();

    const toolset = [
        { id: 'select', label: t('Tools.select'), icon: MousePointer2 },
        { id: 'crop', label: t('Tools.crop'), icon: Crop },
        { id: 'filters', label: t('Tools.filters'), icon: Sparkles },
        { id: 'magic', label: t('Tools.magic'), icon: Wand2 },
    ];

    return (
        <aside className="flex flex-col gap-3 py-6 px-3 bg-white z-10 h-full">
            {toolset.map((tool) => (
                <button
                    key={tool.id}
                    className={clsx(
                        "flex flex-col items-center gap-2 p-2 border-2 border-black rounded-lg cursor-pointer transition-all uppercase shadow-hard-md text-[11px] font-extrabold",
                        activeTool === tool.id
                            ? "bg-amber-400 text-black -translate-x-px -translate-y-px shadow-hard-lg"
                            : "bg-white text-black hover:bg-sky-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-lg",
                        (tool.id === 'crop' && !canCrop) && "opacity-50 cursor-not-allowed bg-gray-200 shadow-none hover:transform-none hover:shadow-none",
                        isLoading && "pointer-events-none opacity-50"
                    )}
                    onClick={() => onToolSelect(tool.id)}
                    disabled={(tool.id === 'crop' && !canCrop) || isLoading}
                    type="button"
                >
                    <tool.icon size={18} />
                    <span className="text-center w-full break-words leading-tight">{tool.label}</span>
                </button>
            ))}
        </aside>
    );
}
