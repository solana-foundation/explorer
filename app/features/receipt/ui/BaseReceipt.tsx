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

const GRID_CLASSNAMES = 'e-grid e-grid-cols-[10px_1fr_1fr_minmax(auto,120px)] e-gap-x-3';

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
        <div className="e-w-full e-max-w-lg">
            <div className="e-bg-outer-space-900">
                <Header date={date} />
                <TransactionSection network={network} confirmationStatus={confirmationStatus} />
                <TransfersTable transfers={transferRows} fee={fee} logoURI={logoURI} tokenHref={tokenHref} />
                {memo && (
                    <div className="e-flex e-flex-col e-gap-1 e-px-6 e-pb-6 e-pt-4 e-text-xs">
                        <span className="e-text-gray-400">Memo</span>
                        <span className="e-text-white">{memo}</span>
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
        <div className="e-flex e-items-center e-justify-between e-gap-x-4 e-border-b e-border-white/10 e-p-6 [border-bottom-style:solid]">
            <h3 className="e-m-0 e-flex-shrink-0 e-font-medium e-text-white">{title}</h3>
            {date && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="e-text-right e-font-mono e-text-xs e-text-gray-400">{date.utc}</span>
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
        <div className="e-flex e-flex-col e-px-6 e-py-3">
            <span className="e-text-xs e-text-gray-400">Transaction</span>
            <div className="e-flex e-items-center e-gap-2">
                <span className="e-text-xs e-text-white">{network}</span>
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
            <div className="e-px-6 e-pb-4 e-text-xs e-text-gray-400">
                <div className={cn('e-items-center e-py-1', GRID_CLASSNAMES)}>
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
                    'e-border-white/10 e-px-6 e-text-xs',
                    'e-border-b [border-bottom-style:dashed]',
                    'e-border-t [border-top-style:dashed]',
                )}
            >
                <div className={cn('e-items-center e-py-4', GRID_CLASSNAMES)}>
                    <span className="e-text-gray-400">Fee</span>
                    <span />
                    <span />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="e-whitespace-nowrap e-text-left e-font-mono e-text-gray-400">
                                {fee.formatted} <span className="e-text-gray-400">SOL</span>
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
        <div className={cn('e-items-center e-py-1', GRID_CLASSNAMES)}>
            <span className="e-text-gray-400">{index}</span>
            <AddressCell address={sender.address} display={senderDisplay} href={senderHref} />
            <AddressCell address={receiver.address} display={receiverDisplay} href={receiverHref} />
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="e-flex e-items-center e-gap-1 e-whitespace-nowrap e-text-left e-font-mono e-text-white">
                        {logoURI &&
                            (tokenHref ? (
                                <a
                                    href={tokenHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="e-flex-shrink-0"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={logoURI}
                                        alt="Token logo"
                                        height="16"
                                        width="16"
                                        className="e-flex-shrink-0"
                                    />
                                </a>
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoURI}
                                    alt="Token logo"
                                    height="16"
                                    width="16"
                                    className="e-flex-shrink-0"
                                />
                            ))}
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
                        <span className="e-hidden sm:e-inline">{display}</span>
                        <span className="e-truncate sm:e-hidden">{address}</span>
                    </a>
                ) : (
                    <span className="e-font-mono e-text-green-400">
                        <span className="e-hidden sm:e-inline">{display}</span>
                        <span className="e-truncate sm:e-hidden">{address}</span>
                    </span>
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
        <PageContainer className="e-flex e-min-h-[90vh] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />

            <div className="e-w-full e-max-w-lg">
                <div className="e-min-h-96 e-bg-outer-space-900">
                    <Header date={date} title="No Receipt" />
                    <div className="e-p-6 e-text-sm e-text-gray-400">
                        <p className="e-m-0">
                            {message ?? 'Receipts are only available for simple SOL and token transfers.'}
                        </p>
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
        </PageContainer>
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
