'use client';

import {useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export function MoreCategoriesMenu({categories, label}: MoreCategoriesMenuProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const menuItems = MORE_FITNESS_CATEGORIES;

    const handleSelectCategory = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground whitespace-nowrap shrink-0 transition-colors py-1 px-2 rounded-md hover:bg-muted/50 focus-visible:outline-none cursor-pointer',
                    open && 'text-electric font-semibold bg-muted/60',
                )}
            >
                <span>{label}</span>
                <ChevronDown className={cn('size-3.5 transition-transform duration-200 opacity-70', open && 'rotate-180 text-electric')} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 sm:w-96 p-2 rounded-2xl shadow-2xl border border-border/80 bg-popover text-popover-foreground z-50 animate-in fade-in-0 zoom-in-95 duration-150"
            >
                <DropdownMenuLabel className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>More Categories</span>
                    <span className="text-[10px] lowercase font-normal bg-electric/10 text-electric px-2 py-0.5 rounded-full font-sans">EMG Collection</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {menuItems.map((cat) => {
                        const Icon = cat.icon || Dumbbell;
                        const targetHref = cat.href || (cat.slug ? `/collection/${cat.slug}` : '/search');
                        return (
                            <DropdownMenuItem
                                key={cat.id || cat.name}
                                onClick={() => handleSelectCategory(targetHref)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/80 cursor-pointer transition-all group"
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
                            </DropdownMenuItem>
                        );
                    })}
                </div>

                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                    onClick={() => handleSelectCategory('/search')}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-center rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer shadow-xs"
                >
                    <LayoutGrid className="size-4" />
                    <span>View All Fitness Equipment & Catalog</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

