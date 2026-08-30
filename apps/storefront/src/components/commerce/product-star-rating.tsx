import {Star} from 'lucide-react';
import {cn} from '@/lib/utils';

interface ProductStarRatingProps {
    stars: number;
    count?: number;
    size?: 'sm' | 'md';
    showCount?: boolean;
    className?: string;
}

export function ProductStarRating({
    stars,
    count,
    size = 'sm',
    showCount = true,
    className,
}: ProductStarRatingProps) {
    const iconSize = size === 'sm' ? 'size-3' : 'size-4';
    const fullStars = Math.floor(stars);
    const hasHalf = stars - fullStars >= 0.5;

    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <div className="inline-flex items-center text-[#ff9900]" aria-hidden>
                {Array.from({length: 5}).map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            iconSize,
                            i < fullStars
                                ? 'fill-current'
                                : i === fullStars && hasHalf
                                  ? 'fill-current opacity-50'
                                  : 'fill-none stroke-current opacity-30',
                        )}
                    />
                ))}
            </div>
            {showCount && count != null && (
                <span className={cn('text-muted-foreground', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
                    {stars.toFixed(1)} ({count})
                </span>
            )}
        </div>
    );
}
