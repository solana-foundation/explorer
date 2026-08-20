'use client';

import { RawDataField } from '@components/shared/RawDataField';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { DialogClose, DialogTitle } from '@components/shared/ui/dialog';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle, Copy, X } from 'react-feather';

import { Copyable } from '@/app/components/common/Copyable';
import type { InstructionSummary } from '@/app/entities/transaction-data';
import { FetchStatus } from '@/app/providers/cache';
import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { Drawer } from '@/app/shared/ui/drawer';
import { KeyValue } from '@/app/shared/ui/key-value';
import { displayTimestampUtc } from '@/app/utils/date';
import { useClusterPath } from '@/app/utils/url';

import { InstructionList, InstructionListSkeleton } from './InstructionList';

export function TransactionDetailsDrawer({
    open,
    onOpenChange,
    signature,
    slot,
    blockTime,
    statusLabel,
    statusVariant,
    instructionNames,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    signature: string;
    slot: number;
    blockTime: number | null | undefined;
    statusLabel: string;
    statusVariant: 'success' | 'warning';
    instructionNames: InstructionSummary[] | undefined;
}) {
    const txPath = useClusterPath({ pathname: `/tx/${signature}` });
    const blockPath = useClusterPath({ pathname: `/block/${slot}` });
    const [copyState, copy] = useCopyToClipboard();
    const [blockCopyState, copyBlock] = useCopyToClipboard();

    const fetchRaw = useFetchRawTransaction();
    const rawDetails = useRawTransactionDetails(signature);
    const transactionData = rawDetails?.data?.raw?.messageBytes;
    const rawLoading = rawDetails?.status === FetchStatus.Fetching;
    useEffect(() => {
        if (open && !transactionData && !rawLoading) fetchRaw(signature);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const header = (
        <Drawer.Header>
            <DialogTitle className="!mt-0 text-base !text-outer-space-300">Transaction</DialogTitle>
            {/* Big signature; the status badge drops to its own line below, with a copy button
                pinned to the end of that line. */}
            <div className="mt-2 flex items-end gap-4 pb-2 text-white">
                <div className="min-w-0 flex-1">
                    <span className="break-all font-mono text-xl">{signature}</span>
                    <div className="mt-1">
                        <Badge ui="dashkit" tone="soft" variant={statusVariant}>
                            {statusLabel}
                        </Badge>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="my-[-4px] border-outer-space-800"
                    aria-label={copyState === 'copied' ? 'Copied signature' : 'Copy signature'}
                    onClick={() => copy(signature)}
                >
                    {copyState === 'copied' ? <CheckCircle size={12} className="text-dk-info" /> : <Copy size={12} />}
                </Button>
            </div>
        </Drawer.Header>
    );

    const footer = (
        <Drawer.Footer>
            <Copyable text={signature} asTile className="flex-1">
                Copy
            </Copyable>
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
        <Drawer open={open} onOpenChange={onOpenChange} header={header} footer={footer}>
            {/* Property table — each row carries a bottom border. */}
            <div className="flex flex-col px-4 pb-4 text-sm">
                {blockTime && (
                    <DrawerRow label="Time">
                        <div className="flex flex-col">
                            <span className="text-white">{displayTimestampUtc(blockTime * 1000, true)}</span>
                            <span className="text-white">
                                <RelativeTime date={blockTime * 1000} />
                            </span>
                        </div>
                    </DrawerRow>
                )}
                <DrawerRow
                    label="Block"
                    trailing={
                        <Button
                            variant="outline"
                            size="sm"
                            className="relative top-[1px] my-[-4px] border-outer-space-800"
                            aria-label={blockCopyState === 'copied' ? 'Copied block number' : 'Copy block number'}
                            onClick={() => copyBlock(slot.toString())}
                        >
                            {blockCopyState === 'copied' ? (
                                <CheckCircle size={12} className="text-dk-info" />
                            ) : (
                                <Copy size={12} />
                            )}
                        </Button>
                    }
                >
                    <Link href={blockPath} className="font-mono text-sm">
                        {slot.toLocaleString('en-US')}
                    </Link>
                </DrawerRow>
                <DrawerRow label="Programs">
                    <div className="min-w-0">
                        {instructionNames !== undefined && instructionNames.length > 0 ? (
                            <InstructionList instructions={instructionNames} />
                        ) : instructionNames === undefined ? (
                            <InstructionListSkeleton />
                        ) : (
                            <span className="text-outer-space-300">---</span>
                        )}
                    </div>
                </DrawerRow>
                {/* No separate "Size (bytes)" label — the raw-data field carries its own "Size"
                    caption before the byte count. Full-width stacked row. */}
                <div className="flex flex-col gap-2 pb-1 pt-2">
                    <div className="min-w-0 text-white">
                        <RawDataField
                            data={transactionData}
                            loading={rawDetails === undefined || rawLoading}
                            filename={signature}
                            variant="embedded"
                            bytesPrefix="Size "
                        />
                    </div>
                </div>
            </div>
        </Drawer>
    );
}

// Thin adapter over the shared KeyValue primitive (compact density = the drawer/mobile row
// treatment): an 80px muted label column, white value, and an optional trailing action pinned at
// the row end. The bottom divider comes from KeyValue's default.
function DrawerRow({
    label,
    trailing,
    children,
}: {
    label: string;
    trailing?: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <KeyValue density="compact" labelWidth="w-20" valueClassName="text-white" trailing={trailing} label={label}>
            {children}
        </KeyValue>
    );
}
