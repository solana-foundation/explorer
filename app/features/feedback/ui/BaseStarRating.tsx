import { useId } from 'react';
import { Star } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

export interface BaseStarRatingProps {
    onChange?: (rating: number) => void;
    value?: number;
}

const STARS = [1, 2, 3, 4, 5];

export function BaseStarRating({ onChange, value = 0 }: BaseStarRatingProps) {
    // Two feedback forms can be mounted at once, and radios with the same name form one group.
    const name = useId();

    return (
        <div aria-label="Rating" className="flex items-center justify-center gap-1" role="radiogroup">
            {STARS.map(star => (
                // The browser gives native radios arrow-key navigation and a single tab stop.
                <label key={star} className="cursor-pointer p-1">
                    <input
                        aria-label={`${star} of ${STARS.length} stars`}
                        checked={value === star}
                        className="peer sr-only"
                        name={name}
                        onChange={() => onChange?.(star)}
                        type="radio"
                        value={star}
                    />
                    <Star
                        aria-hidden="true"
                        className={cn(
                            'rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-900',
                            star <= value ? 'fill-accent text-accent' : 'fill-heavy-metal-600 text-heavy-metal-600',
                        )}
                        size={36}
                    />
                </label>
            ))}
        </div>
    );
}
