import { cn } from '@shared/utils';
import { Check } from 'react-feather';

export function VerifiedBadge() {
    return (
        <div
            className={cn(
                'flex shrink-0 items-center',
                'rounded border border-solid border-success-500',
                'p-1 text-success-500',
            )}
        >
            <Check size={9} strokeWidth={3} />
        </div>
    );
}
