'use client';

import { RawDataField } from '@components/shared/RawDataField';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { DialogClose, DialogTitle } from '@components/shared/ui/dialog';
import Link from 'next/link';
import React from 'react';
import { ArrowRight, X } from 'react-feather';

import { RelativeTime } from '@/app/shared/RelativeTime';
import { CopyButton } from '@/app/shared/ui/CopyButton';
import { Drawer } from '@/app/shared/ui/drawer';
import { displayTimestampUtc } from '@/app/utils/date';
import { useClusterPath } from '@/app/utils/url';

import type { RowTransactionState } from '../model/use-row-transaction';
import { CompactKeyValue } from './CompactKeyValue';
import { ProgramsBlock } from './InstructionList';
import { RetryButton } from './RetryButton';

export function TransactionDetailsDrawer({
    open,
    onOpenChange,
    signature,
    slot,
    blockTime,
    statusLabel,
    statusVariant,
    rowTransaction,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signature: string;
    slot: number;
    blockTime: number | null | undefined;
    statusLabel: string;
    statusVariant: 'success' | 'warning';
    rowTransaction: RowTransactionState;
}) {
    const txPath = useClusterPath({ pathname: `/tx/${signature}` });
    const blockPath = useClusterPath({ pathname: `/block/${slot}` });

    const header = (
        <Drawer.Header>
            <DialogTitle className="!mt-0 text-base !text-outer-space-300">Transaction</DialogTitle>
            <div className="mt-2 flex items-end gap-4 pb-2 text-white">
                <div className="min-w-0 flex-1">
                    <span className="break-all font-mono text-xl">{signature}</span>
                    <div className="mt-1">
                        <Badge ui="dashkit" tone="soft" variant={statusVariant}>
                            {statusLabel}
                        </Badge>
                    </div>
                </div>
                <CopyButton value={signature} noun="signature" className="my-[-4px]" />
            </div>
        </Drawer.Header>
    );

    const footer = (
        <Drawer.Footer>
            <CopyButton value={signature} noun="signature" size="tile" flash className="flex-1">
                Copy
            </CopyButton>
            <Button asChild size="tile" className="flex-1" variant="accent">
                <Link href={txPath}>
                    <ArrowRight size={18} />
                    Open
                </Link>
            </Button>
            <DialogClose asChild>
                <Button className="flex-1" size="tile" variant="outline">
                    <X size={18} />
                    Close
                </Button>
            </DialogClose>
        </Drawer.Footer>
    );

    return (
        <Drawer open={open} onOpenChange={onOpenChange} header={header} footer={footer} aria-describedby={undefined}>
            <div className="flex flex-col px-4 pb-4 text-sm">
                {blockTime && (
                    <CompactKeyValue label="Time">
                        <div className="flex flex-col">
                            <span>{displayTimestampUtc(blockTime * 1000, true)}</span>
                            <RelativeTime date={blockTime * 1000} />
                        </div>
                    </CompactKeyValue>
                )}
                <CompactKeyValue
                    label="Block"
                    trailing={
                        <CopyButton
                            value={slot.toString()}
                            noun="block number"
                            className="relative top-[1px] my-[-4px]"
                        />
                    }
                >
                    <Link href={blockPath} className="font-mono text-sm">
                        {slot.toLocaleString('en-US')}
                    </Link>
                </CompactKeyValue>
                <CompactKeyValue label="Programs">
                    <div className="min-w-0">
                        <ProgramsBlock state={rowTransaction} />
                    </div>
                </CompactKeyValue>
                <SizeField state={rowTransaction} filename={signature} />
            </div>
        </Drawer>
    );
}

function SizeField({ state, filename }: { state: RowTransactionState; filename: string }) {
    if (state.status === 'failed') {
        return (
            <CompactKeyValue label="Size">
                <RetryButton label="Retry loading size" onRetry={state.retry} />
            </CompactKeyValue>
        );
    }
    // The raw-data field carries its own "Size" caption, so this row has no label.
    return (
        <div className="flex flex-col gap-2 pb-1 pt-2 text-white">
            <RawDataField
                data={state.status === 'loaded' ? state.messageBytes : undefined}
                loading={state.status === 'loading'}
                filename={filename}
                variant="embedded"
                bytesPrefix="Size "
            />
        </div>
    );
}
