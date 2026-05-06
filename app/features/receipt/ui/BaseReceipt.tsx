'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { displayTimestamp } from '@utils/date';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { FormattedExtendedReceipt, TransferRow } from '../types';

interface BaseReceiptProps {
    data: FormattedExtendedReceipt;
}

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
        senderHref,
        receiverHref,
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
        <div className="e-w-full e-max-w-lg">
            <div className="e-bg-outer-space-900">
                <Header date={date} />
                <TransactionSection network={network} confirmationStatus={confirmationStatus} />
                <TransfersTable transfers={transferRows} fee={fee} />
                {memo && (
                    <div className="e-flex e-flex-col e-gap-1 e-px-6 e-pb-6 e-text-xs">
                        <span className="e-text-gray-400">Memo</span>
                        <span className="e-text-white">{memo}</span>
                    </div>
                )}
            </div>
            <Zigzag />
        </div>
    );
}

export function Header({ date }: { date?: FormattedExtendedReceipt['date'] }) {
    return (
        <div className="e-flex e-items-center e-justify-between e-gap-x-4 e-border-b e-border-white/10 e-p-6 e-pt-8 [border-bottom-style:solid]">
            <h3 className="e-m-0 e-flex-shrink-0 e-font-medium e-text-white">Solana Receipt</h3>
            {date && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="e-text-right e-font-mono e-text-sm e-text-gray-400">{date.utc}</span>
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
        <div className="e-flex e-flex-col e-gap-1 e-px-6 e-py-4">
            <span className="e-text-xs e-text-gray-400">Transaction</span>
            <div className="e-flex e-items-center e-gap-2">
                <span className="e-text-sm e-text-white">{network}</span>
                <Badge size="sm" variant="success">
                    {confirmationStatus
                        ? confirmationStatus.charAt(0).toUpperCase() + confirmationStatus.slice(1).toLowerCase()
                        : 'Unknown'}
                </Badge>
            </div>
        </div>
    );
}

function TransfersTable({ transfers, fee }: { transfers: TransferRow[]; fee: FormattedExtendedReceipt['fee'] }) {
    return (
        <div className="e-px-6 e-pb-4 e-text-xs e-text-gray-400">
            <div className="e-grid e-grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] e-gap-x-3 e-pb-2">
                <span>#</span>
                <span>Sender</span>
                <span>Receiver</span>
                <span className="e-text-right">Amount</span>
            </div>
            {transfers.map((row, i) => (
                <TransferRowItem key={i} index={i + 1} row={row} />
            ))}
            <div className="e-my-3 e-border-t e-border-white/10 [border-top-style:dashed]" />
            <div className="e-grid e-grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] e-items-center e-gap-x-3 e-py-1">
                <span>–</span>
                <span>Fee</span>
                <span />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="e-text-right">{fee.formatted} SOL</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{fee.raw} lamports</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

function TransferRowItem({ index, row }: { index: number; row: TransferRow }) {
    const { sender, receiver, amount, senderHref, receiverHref } = row;
    const senderDisplay = sender.domain ?? sender.truncated;
    const receiverDisplay = receiver.domain ?? receiver.truncated;

    return (
        <div className="e-grid e-grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] e-items-center e-gap-x-3 e-py-1 e-text-xs">
            <span className="e-text-gray-400">{index}</span>
            <AddressCell address={sender.address} display={senderDisplay} href={senderHref} />
            <AddressCell address={receiver.address} display={receiverDisplay} href={receiverHref} />
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="e-whitespace-nowrap e-text-right e-font-mono e-text-white">
                        {amount.formatted} <span className="e-text-gray-400">{amount.unit}</span>
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
                        className="e-truncate e-font-mono e-text-green-400 hover:e-underline"
                    >
                        {display}
                    </a>
                ) : (
                    <span className="e-truncate e-font-mono e-text-green-400">{display}</span>
                )}
            </TooltipTrigger>
            <TooltipContent side="top">
                <span className="e-text-green-400">{address}</span>
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
}: {
    transactionPath: string;
    timestamp?: number | null;
    onViewTxClick?: () => void;
    onRedirect?: () => void;
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
        <div className="container e-flex e-min-h-[90vh] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />

            <div className="e-w-full e-max-w-lg">
                <div className="e-min-h-96 e-bg-outer-space-900">
                    <Header date={date} />
                    <div className="e-p-6 e-text-sm e-text-gray-400">
                        <p className="e-m-0">Receipts can only be generated for SOL or token transfer transactions.</p>
                        <p className="e-m-0 e-mt-4">Forwarding to transaction view in {countdown}...</p>
                    </div>
                </div>
                <Zigzag />
            </div>

            <Button size="sm" className="e-me-2" asChild>
                <Link href={transactionPath} onClick={onViewTxClick}>
                    View transaction in Explorer
                </Link>
            </Button>
        </div>
    );
}

export function Zigzag() {
    return <div className="zigzag e-bg-outer-space-900 e-pb-6" />;
}

export function BlurredCircle() {
    return (
        <div className="e-absolute e-left-[50%] e-top-[55%] e-z-[-1] e-h-2/5 e-w-1/3 e-translate-x-[-50%] e-translate-y-[-50%] e-rounded-full e-bg-emerald-700 e-blur-[150px]" />
    );
}
