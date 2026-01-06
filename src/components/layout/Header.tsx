import { useTranslations } from 'next-intl';
import { Sparkles, Settings2, Eraser, Camera, SunMedium, Palette, Zap, Image as ImageIcon } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import clsx from 'clsx';

interface HeaderProps {
    onMenuClick: (item: string) => void;
    onQuickEditValues: (prompt: string) => void;
    isLoading?: boolean;
}

export function Header({ onMenuClick, onQuickEditValues, isLoading }: HeaderProps) {
    const t = useTranslations();
    const { showAlert } = useModal();

    const menuItems = [
        { id: 'Help', label: t('Header.help') }
    ];

    const quickEdits = [
        { label: t('Header.cleanBackground'), prompt: 'Isolate the main subject, remove distractions, replace background with a soft neutral gradient backdrop, keep natural shadows, commercial studio polish', icon: Eraser },
        { label: t('Header.productPop'), prompt: 'Create a premium e-commerce hero shot, punchy contrast, sharpened edges, controlled reflections, glossy highlights, gradient sweep backdrop', icon: Camera },
        { label: t('Header.portraitGlow'), prompt: 'Subtle portrait retouch, even skin tone, soften blemishes, add warm golden rim light, cinematic bokeh background, high-end magazine aesthetic', icon: SunMedium },
        { label: t('Header.cinematicMood'), prompt: 'Apply dramatic teal and amber cinematic grade, lifted blacks, gentle bloom, volumetric atmosphere, film grain, widescreen energy', icon: Palette },
        { label: t('Header.vibrantNeon'), prompt: 'Introduce neon magenta and cyan rim lighting, subtle glow trails, futuristic highlights, reflective surfaces, cyberpunk energy', icon: Zap },
        { label: t('Header.matteVintage'), prompt: 'Apply vintage matte film look, muted shadows, gentle halation, warm highlights, dusted texture, analog imperfections', icon: Sparkles },
    ];

    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b-3 border-black z-10 gap-4 flex-wrap shrink-0">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <Sparkles className="text-violet-600 drop-shadow-[2px_2px_0px_#000]" size={20} />
                <div>
                    <p className="font-black text-xl m-0 text-black tracking-tighter uppercase">{t('HomePage.title')}</p>
                    <span className="text-xs text-black font-bold bg-emerald-200 px-2 py-0.5 border-2 border-black rounded-md shadow-hard-sm">
                        POWER BY NANOBANANA
                    </span>
                </div>
            </div>

            {/* Quick Action Nav */}
            <div className="flex gap-2 overflow-x-auto px-2 scrollbar-none flex-1 justify-center min-w-[220px]">
                {quickEdits.map((action) => (
                    <button
                        key={action.label}
                        className={clsx(
                            "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 border-2 border-black rounded-full",
                            "text-[10px] font-bold bg-white cursor-pointer shadow-hard-sm uppercase transition-transform",
                            "hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-md hover:bg-violet-100",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => onQuickEditValues(action.prompt)}
                        disabled={isLoading}
                        type="button"
                    >
                        <action.icon size={14} />
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Menu Strip */}
            <nav className="flex gap-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={clsx(
                            "text-xs font-bold px-3 py-1 bg-white border-2 border-black rounded-lg cursor-pointer shadow-hard-md transition-transform",
                            "hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-lg hover:bg-amber-100"
                        )}
                        onClick={() => onMenuClick(item.id)}
                        type="button"
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Status Cluster */}
            <div className="flex items-center gap-4 text-sm font-bold text-black">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-black bg-emerald-500" />
                    <span>{t('Status.ready')}</span>
                </div>
                <button
                    className={clsx(
                        "flex items-center gap-2 border-2 border-black bg-white text-black px-4 py-2 rounded-lg cursor-pointer text-xs font-bold shadow-hard-md transition-transform",
                        "hover:-translate-x-px hover:-translate-y-px hover:shadow-hard-lg hover:bg-purple-100"
                    )}
                    type="button"
                    onClick={() => showAlert({ title: 'Coming Soon', message: 'Studio preferences coming soon!', type: 'default' })}
                >
                    <Settings2 size={16} />
                    {t('Header.studioPrefs')}
                </button>
            </div>
        </header>
    );
}
