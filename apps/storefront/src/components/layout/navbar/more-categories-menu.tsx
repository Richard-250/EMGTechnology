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
} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

interface MoreCategoriesMenuProps {
    categories: CategoryItem[];
    label: string;
}

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
    cardio: HeartPulse,
    strength: Dumbbell,
    'home-gyms': Layers,
    accessories: ShoppingBag,
    featured: Flame,
    'free-weights': Dumbbell,
    'yoga-recovery': Activity,
    commercial: Trophy,
};

export function MoreCategoriesMenu({categories, label}: MoreCategoriesMenuProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const extraCategories = categories.length > 0 ? categories : [
        {id: '1', name: 'Accessories & Belts', slug: 'accessories', description: 'Gym wraps, gloves & belts'},
        {id: '2', name: 'Home Gym Packages', slug: 'home-gyms', description: 'Complete multi-station gyms'},
        {id: '3', name: 'Cardio Machines', slug: 'cardio', description: 'Treadmills, rowers & bikes'},
        {id: '4', name: 'Strength & Free Weights', slug: 'strength', description: 'Racks, plates & dumbbells'},
        {id: '5', name: 'Commercial Equipment', slug: 'featured', description: 'Heavy-duty gym systems'},
    ];

    const handleSelectCategory = (slug: string) => {
        setOpen(false);
        router.push(`/collection/${slug}`);
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
                className="w-64 p-2 rounded-xl shadow-lg border border-border/80 bg-popover text-popover-foreground"
            >
                <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Additional Categories
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
                    {extraCategories.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.slug] || Dumbbell;
                        return (
                            <DropdownMenuItem
                                key={cat.id || cat.slug}
                                onClick={() => handleSelectCategory(cat.slug)}
                                className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-muted/70 cursor-pointer transition-colors group"
                            >
                                <span className="flex size-8 items-center justify-center rounded-lg bg-electric/10 text-electric group-hover:bg-electric group-hover:text-electric-foreground shrink-0 transition-colors">
                                    <Icon className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-electric transition-colors leading-tight">
                                        {cat.name}
                                    </p>
                                    {cat.description && (
                                        <p className="text-[11px] text-muted-foreground truncate leading-snug">
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
                    onClick={() => handleSelectCategory('featured')}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-center rounded-lg bg-electric/10 text-electric hover:bg-electric hover:text-electric-foreground transition-colors cursor-pointer"
                >
                    <Sparkles className="size-3.5" />
                    View All Fitness Categories
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
