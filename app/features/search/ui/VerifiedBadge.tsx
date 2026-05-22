import { cn } from '@shared/utils';
import { Check } from 'react-feather';

export function VerifiedBadge() {
    return (
        <div
            className={cn(
                'e-flex e-shrink-0 e-items-center',
                'e-rounded e-border e-border-solid e-border-success-500',
                'e-p-1 e-text-success-500',
            )}
        >
            <Check size={9} strokeWidth={3} />
        </div>
    );
}
