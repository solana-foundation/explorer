'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { cn } from '@components/shared/utils';
import { displayTimestamp } from '@utils/date';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

import type { FormattedExtendedReceipt, TransferRow } from '../types';

interface BaseReceiptProps {
    data: FormattedExtendedReceipt;
}

const GRID_CLASSNAMES = 'grid grid-cols-[10px_1fr_1fr_minmax(auto,120px)] gap-x-3';

export function BaseReceipt({
    data: {
        date,
        sender,
        receiver,
        network,
        fee,
        total,
        memo,
        confirmationStatus,
        logoURI,
        senderHref,
        receiverHref,
        tokenHref,
        transfers,
    },
}: BaseReceiptProps) {
    const transferRows: TransferRow[] = transfers ?? [
        {
            amount: total,
            receiver,
            receiverHref,
            sender,
            senderHref,
        },
    ];

    return (
        <div className="w-full max-w-lg">
            <div className="bg-outer-space-900">
                <Header date={date} />
                <TransactionSection network={network} confirmationStatus={confirmationStatus} />
                <TransfersTable transfers={transferRows} fee={fee} logoURI={logoURI} tokenHref={tokenHref} />
                {memo && (
                    <div className="flex flex-col gap-1 px-6 pb-6 pt-4 text-xs">
                        <span className="text-gray-400">Memo</span>
                        <span className="text-white">{memo}</span>
                    </div>
                )}
            </div>
            <Zigzag />
        </div>
    );
}

export function Header({
    date,
    title = 'Solana Receipt',
}: {
    date?: FormattedExtendedReceipt['date'];
    title?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-x-4 border-b border-white/10 p-6 [border-bottom-style:solid]">
            <h3 className="m-0 flex-shrink-0 font-medium text-white">{title}</h3>
            {date && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="text-right font-mono text-xs text-gray-400">{date.utc}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{displayTimestamp(date.timestamp, true)}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

function TransactionSection({
    network,
    confirmationStatus,
}: Pick<FormattedExtendedReceipt, 'network' | 'confirmationStatus'>) {
    return (
        <div className="flex flex-col px-6 py-3">
            <span className="text-xs text-gray-400">Transaction</span>
            <div className="flex items-center gap-2">
                <span className="text-xs text-white">{network}</span>
                <Badge size="xs" variant="success">
                    {confirmationStatus
                        ? confirmationStatus.charAt(0).toUpperCase() + confirmationStatus.slice(1).toLowerCase()
                        : 'Unknown'}
                </Badge>
            </div>
        </div>
    );
}

function TransfersTable({
    transfers,
    fee,
    logoURI,
    tokenHref,
}: {
    transfers: TransferRow[];
    fee: FormattedExtendedReceipt['fee'];
    logoURI?: string;
    tokenHref?: string;
}) {
    return (
        <div>
            <div className="px-6 pb-4 text-xs text-gray-400">
                <div className={cn('items-center py-1', GRID_CLASSNAMES)}>
                    <span>#</span>
                    <span>Sender</span>
                    <span>Receiver</span>
                    <span>Amount</span>
                </div>
                {transfers.map((row, i) => (
                    <TransferRowItem key={i} index={i + 1} row={row} logoURI={logoURI} tokenHref={tokenHref} />
                ))}
            </div>
            <div
                className={cn(
                    'border-white/10 px-6 text-xs',
                    'border-b [border-bottom-style:dashed]',
                    'border-t [border-top-style:dashed]',
                )}
            >
                <div className={cn('items-center py-4', GRID_CLASSNAMES)}>
                    <span className="text-gray-400">Fee</span>
                    <span />
                    <span />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="whitespace-nowrap text-left font-mono text-gray-400">
                                {fee.formatted} <span className="text-gray-400">SOL</span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{fee.raw} lamports</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

function TransferRowItem({
    index,
    row,
    logoURI,
    tokenHref,
}: {
    index: number;
    row: TransferRow;
    logoURI?: string;
    tokenHref?: string;
}) {
    const { sender, receiver, amount, senderHref, receiverHref } = row;
    const senderDisplay = sender.domain ?? sender.truncated;
    const receiverDisplay = receiver.domain ?? receiver.truncated;

    return (
        <div className={cn('items-center py-1', GRID_CLASSNAMES)}>
            <span className="text-gray-400">{index}</span>
            <AddressCell address={sender.address} display={senderDisplay} href={senderHref} />
            <AddressCell address={receiver.address} display={receiverDisplay} href={receiverHref} />
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 whitespace-nowrap text-left font-mono text-white">
                        {logoURI &&
                            (tokenHref ? (
                                <a
                                    href={tokenHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoURI}
                                        alt="Token logo"
                                        height="16"
                                        width="16"
                                        className="flex-shrink-0"
                                    />
                                </a>
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoURI}
                                    alt="Token logo"
                                    height="16"
                                    width="16"
                                    className="flex-shrink-0"
                                />
                            ))}
                        {amount.formatted} <span className="text-gray-400">{amount.unit}</span>
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    {amount.unit === 'SOL' ? `${amount.raw} lamports` : `${amount.raw} ${amount.unit}`}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

function AddressCell({ address, display, href }: { address: string; display: string; href?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {href ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-mono text-green-400 hover:underline"
                    >
                        <span className="hidden sm:inline">{display}</span>
                        <span className="truncate sm:hidden">{address}</span>
                    </a>
                ) : (
                    <span className="font-mono text-green-400">
                        <span className="hidden sm:inline">{display}</span>
                        <span className="truncate sm:hidden">{address}</span>
                    </span>
                )}
            </TooltipTrigger>
            <TooltipContent side="top">
                <span className="text-green-400">{address}</span>
            </TooltipContent>
        </Tooltip>
    );
}

const REDIRECT_COUNTDOWN = 5;

export function NoReceipt({
    transactionPath,
    timestamp,
    onViewTxClick,
    onRedirect,
    message,
}: {
    transactionPath: string;
    timestamp?: number | null;
    onViewTxClick?: () => void;
    onRedirect?: () => void;
    message?: string;
}) {
    const date = timestamp ? { timestamp: timestamp * 1000, utc: new Date(timestamp * 1000).toISOString() } : undefined;
    const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN);

    useEffect(() => {
        if (countdown <= 0) {
            onRedirect?.();
            return;
        }

        const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, onRedirect]);

    return (
        <PageContainer className="flex min-h-[90vh] flex-col items-center justify-center gap-6 px-5 py-10">
            <BlurredCircle />

            <div className="w-full max-w-lg">
                <div className="min-h-96 bg-outer-space-900">
                    <Header date={date} title="No Receipt" />
                    <div className="p-6 text-sm text-gray-400">
                        <p className="m-0">
                            {message ?? 'Receipts are only available for simple SOL and token transfers.'}
                        </p>
                        <p className="m-0 mt-4">Forwarding to transaction view in {countdown}...</p>
                    </div>
                </div>
                <Zigzag />
            </div>

            <Button size="sm" className="me-2" asChild>
                <Link href={transactionPath} onClick={onViewTxClick}>
                    View transaction in Explorer
                </Link>
            </Button>
        </PageContainer>
    );
}

export function Zigzag() {
    return <div className="zigzag bg-outer-space-900 pb-6" />;
}

export function BlurredCircle() {
    return (
        <div className="absolute left-[50%] top-[55%] z-[-1] h-2/5 w-1/3 translate-x-[-50%] translate-y-[-50%] rounded-full bg-emerald-700 blur-[150px]" />
    );
}
