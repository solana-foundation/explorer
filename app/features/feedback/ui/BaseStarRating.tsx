import { useId } from 'react';
import { Star } from 'react-feather';

import { cn } from '@/app/components/shared/utils';

export interface BaseStarRatingProps {
    onChange?: (rating: number) => void;
    /** 0 means no rating selected. */
    value?: number;
}

const STARS = [1, 2, 3, 4, 5];

export function BaseStarRating({ onChange, value = 0 }: BaseStarRatingProps) {
    // Two forms can be mounted at once, so each group needs its own name to stay independent
    const name = useId();

    return (
        <div aria-label="Rating" className="flex items-center justify-center gap-1" role="radiogroup">
            {STARS.map(star => (
                // A hidden native radio, not a button, so the browser gives the group arrow-key navigation and one tab stop
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
