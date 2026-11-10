import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { RefreshCw } from 'react-feather';

export function RetryButton({ label, onRetry, className }: { label: string; onRetry: () => void; className?: string }) {
    return (
        <Button
            variant="ghost"
            size="inline"
            className={cn('text-outer-space-300', className)}
            onClick={() => onRetry()}
            aria-label={label}
        >
            <RefreshCw size={14} />
            <span>Retry</span>
        </Button>
    );
}
