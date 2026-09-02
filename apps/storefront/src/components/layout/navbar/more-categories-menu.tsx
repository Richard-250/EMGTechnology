'use client';

import {useState, useRef, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {
    ChevronDown,
    Dumbbell,
    Flame,
    HeartPulse,
    Layers,
    ShoppingBag,
    Sparkles,
    Activity,
    Trophy,
    ShieldCheck,
    Zap,
    LayoutGrid,
} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface CategoryItem {
    id?: string;
    name: string;
    slug?: string;
    href?: string;
    description?: string;
    icon?: typeof Dumbbell;
}

interface MoreCategoriesMenuProps {
    categories?: CategoryItem[];
    label: string;
}

const MORE_FITNESS_CATEGORIES: CategoryItem[] = [
    {
        id: 'acc',
        name: 'Accessories & Fitness Gear',
        href: '/collection/accessories',
        description: 'Gym belts, straps, wraps, resistance bands & mats',
        icon: ShoppingBag,
    },
    {
        id: 'comm',
        name: 'Commercial Gym Systems',
        href: '/search?q=commercial',
        description: 'Heavy-duty clubs, training rigs & commercial multi-gyms',
        icon: Trophy,
    },
    {
        id: 'tread',
        name: 'Treadmills & Running',
        href: '/search?q=treadmill',
        description: 'Motorized, curved & foldable running treadmills',
        icon: Activity,
    },
    {
        id: 'ellip',
        name: 'Ellipticals & Cross Trainers',
        href: '/search?q=elliptical',
        description: 'Magnetic resistance & commercial cross trainers',
        icon: HeartPulse,
    },
    {
        id: 'bike',
        name: 'Exercise Bikes & Spinners',
        href: '/search?q=bike',
        description: 'Spin bikes, recumbent & upright cycles',
        icon: Zap,
    },
    {
        id: 'row',
        name: 'Rowing Machines',
        href: '/search?q=rowing',
        description: 'Water, magnetic & air resistance rowing machines',
        icon: Layers,
    },
    {
        id: 'weights',
        name: 'Free Weights & Dumbbells',
        href: '/search?q=dumbbells',
        description: 'Hex dumbbells, Olympic barbells & weight plates',
        icon: Dumbbell,
    },
    {
        id: 'racks',
        name: 'Power Racks & Multi-Benches',
        href: '/search?q=rack',
        description: 'Squat racks, multi-press smith machines & benches',
        icon: Flame,
    },
    {
        id: 'yoga',
        name: 'Yoga & Muscle Recovery',
        href: '/search?q=yoga',
        description: 'Foam rollers, yoga mats & massage recovery gear',
        icon: Sparkles,
    },
    {
        id: 'multi',
        name: 'Multi-Station Gyms',
        href: '/collection/home-gyms',
        description: 'All-in-one functional cable training systems',
        icon: ShieldCheck,
    },
];

export function MoreCategoriesMenu({label}: MoreCategoriesMenuProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const menuItems = MORE_FITNESS_CATEGORIES;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleSelectCategory = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={open}
                className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground whitespace-nowrap shrink-0 transition-colors py-1 px-2.5 rounded-md hover:bg-muted/50 focus-visible:outline-none cursor-pointer',
                    open && 'text-electric font-semibold bg-muted/60',
                )}
            >
                <span>{label}</span>
                <ChevronDown className={cn('size-3.5 transition-transform duration-200 opacity-70', open && 'rotate-180 text-electric')} />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-2.5 rounded-2xl shadow-2xl border border-border/80 bg-background text-foreground z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/60 pb-2 mb-1.5">
                        <span>More Categories</span>
                        <span className="text-[10px] lowercase font-normal bg-electric/10 text-electric px-2 py-0.5 rounded-full font-sans">EMG Collection</span>
                    </div>

                    <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                        {menuItems.map((cat) => {
                            const Icon = cat.icon || Dumbbell;
                            const targetHref = cat.href || '/search';
                            return (
                                <button
                                    key={cat.id || cat.name}
                                    type="button"
                                    onClick={() => handleSelectCategory(targetHref)}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/80 cursor-pointer transition-all group"
                                >
                                    <span className="flex size-9 items-center justify-center rounded-xl bg-electric/10 text-electric group-hover:bg-electric group-hover:text-electric-foreground shrink-0 transition-all shadow-xs">
                                        <Icon className="size-4.5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground group-hover:text-electric transition-colors leading-tight">
                                            {cat.name}
                                        </p>
                                        {cat.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug mt-0.5">
                                                {cat.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="border-t border-border/60 pt-2 mt-2">
                        <button
                            type="button"
                            onClick={() => handleSelectCategory('/search')}
                            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-center rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs"
                        >
                            <LayoutGrid className="size-4" />
                            <span>View All Fitness Equipment & Catalog</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


