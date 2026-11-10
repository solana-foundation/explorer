'use client';

import { RawDataField } from '@components/shared/RawDataField';
import { Button } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { Skeleton } from '@components/shared/ui/skeleton';
import { Code } from 'react-feather';

import type { RowTransactionState } from '../model/use-row-transaction';
import { RetryButton } from './RetryButton';

// Moves the text-height button down to the baseline of the row's other cells.
const ROW_BASELINE = 'relative top-0.5';

export function RawDataSizeField({ state, filename }: { state: RowTransactionState; filename: string }) {
    switch (state.status) {
        case 'loading':
            return <Skeleton className="tx-size-skeleton my-1 h-3.5 w-16" />;
        case 'failed':
            return <SizeRetryButton onRetry={state.retry} className={ROW_BASELINE} />;
        case 'loaded':
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="inline" className={ROW_BASELINE}>
                            <Code size={14} />
                            <span>{state.messageBytes.length.toLocaleString('en-US')}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto !rounded-lg border-none p-0" align="end">
                        <RawDataField data={state.messageBytes} filename={filename} />
                    </PopoverContent>
                </Popover>
            );
        default:
            return state satisfies never;
    }
}

export function SizeRetryButton({ onRetry, className }: { onRetry: () => void; className?: string }) {
    return <RetryButton label="Retry loading size" onRetry={onRetry} className={className} />;
}
