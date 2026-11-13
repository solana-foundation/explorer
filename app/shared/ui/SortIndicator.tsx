import { ChevronDown, ChevronUp } from 'react-feather';

import { cn } from '@/app/components/shared/utils';
import { type SortDirection } from '@/app/shared/lib/sort-direction';

// A dim up/down chevron pair marking a sortable header; the arrow for the active direction lights up
// white. `direction` undefined marks an inactive column, so a caller never passes a stale direction.
// Absolutely positioned in an `h-4`/`w-1` box so the taller glyph stack doesn't grow the row.
export function SortIndicator({ direction }: { direction?: SortDirection }) {
    return (
        <span className="relative inline-block h-4 w-1">
            <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center leading-none">
                <ChevronUp
                    size={11}
                    strokeWidth={2.5}
                    className={direction === 'asc' ? 'text-white' : 'text-outer-space-300'}
                />
                <ChevronDown
                    size={11}
                    strokeWidth={2.5}
                    className={cn('-mt-1', direction === 'desc' ? 'text-white' : 'text-outer-space-300')}
                />
            </span>
        </span>
    );
}
