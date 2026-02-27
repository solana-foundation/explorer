'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/shared/ui/tooltip';
import { cn } from '@components/shared/utils';
import { displayTimestamp } from '@utils/date';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { FormattedExtendedReceipt } from '../types';

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
        logoURI,
        senderHref,
        receiverHref,
        tokenHref,
    },
}: BaseReceiptProps) {
    return (
        <div className="e-w-full e-max-w-lg">
            <div className="e-bg-outer-space-900">
                <Header date={date} />
                <Content
                    sender={sender}
                    receiver={receiver}
                    network={network}
                    confirmationStatus={confirmationStatus}
                    senderHref={senderHref}
                    receiverHref={receiverHref}
                />
                <div className="e-my-5 e-border-t e-border-white/10 [border-top-style:dashed]" />
                <Footer fee={fee} total={total} memo={memo} logoURI={logoURI} tokenHref={tokenHref} />
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

function Content({
    sender,
    receiver,
    network,
    confirmationStatus,
    senderHref,
    receiverHref,
}: Pick<FormattedExtendedReceipt, 'sender' | 'receiver' | 'network' | 'confirmationStatus'> & {
    senderHref?: string;
    receiverHref?: string;
}) {
    return (
        <div className="e-grid e-grid-cols-2 e-gap-6 e-p-6 e-pt-8 e-text-sm e-text-gray-400">
            <ListItem
                label="Sender"
                tooltipText={sender.address}
                value={sender.domain ?? sender.truncated}
                href={senderHref}
            />
            <ListItem
                label="Receiver"
                tooltipText={receiver.address}
                value={receiver.domain ?? receiver.truncated}
                href={receiverHref}
            />
            <span>Status</span>
            <div className="e-text-right">
                <Badge size="sm" variant="success">
                    {confirmationStatus
                        ? confirmationStatus.charAt(0).toUpperCase() + confirmationStatus.slice(1).toLowerCase()
                        : 'Unknown'}
                </Badge>
            </div>
            <ListItem label="Network" className="e-text-white" value={network} />
        </div>
    );
}

function ListItem({
    label,
    value,
    className,
    tooltipText,
    href,
}: {
    label: string;
    value?: string;
    className?: string;
    tooltipText?: string;
    href?: string;
}) {
    if (!value) return null;

    const content = (
        <span className={cn('e-truncate e-text-right e-font-mono e-text-green-400', className)}>{value}</span>
    );

    return (
        <>
            <span>{label}</span>
            <Tooltip>
                <div className="e-text-right">
                    <TooltipTrigger asChild>
                        {href ? (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn('e-truncate e-font-mono e-text-green-400 hover:e-underline', className)}
                            >
                                {value}
                            </a>
                        ) : (
                            content
                        )}
                    </TooltipTrigger>
                </div>
                {tooltipText && (
                    <TooltipContent side="top">
                        <span className="e-text-green-400">{tooltipText}</span>
                    </TooltipContent>
                )}
            </Tooltip>
        </>
    );
}

function Footer({
    fee,
    total,
    memo,
    logoURI,
    tokenHref,
}: Pick<FormattedExtendedReceipt, 'fee' | 'total' | 'memo' | 'logoURI' | 'tokenHref'>) {
    return (
        <div className="e-p-6 e-pt-0 e-text-xs e-text-gray-400">
            <div className="e-grid e-grid-cols-2 e-items-center">
                <span className="e-text-white">Total</span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="e-ml-auto e-flex e-w-fit e-items-center e-gap-2">
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
                                            height="20"
                                            width="20"
                                            className="e-flex-shrink-0"
                                        />
                                    </a>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={logoURI}
                                        alt="Token logo"
                                        height="20"
                                        width="20"
                                        className="e-flex-shrink-0"
                                    />
                                ))}
                            <span className="e-whitespace-nowrap e-text-2xl e-text-white">
                                {total.formatted} {total.unit}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {total.unit === 'SOL' ? `${total.raw} lamports` : `${total.raw} ${total.unit}`}
                    </TooltipContent>
                </Tooltip>
                <span>Fee</span>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="e-ml-auto e-block e-w-fit">{fee.formatted} SOL</span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{fee.raw} lamports</TooltipContent>
                </Tooltip>
            </div>

            {memo && (
                <div className="e-mt-3 e-flex e-flex-col e-gap-1">
                    <span>Memo</span>
                    <span className="e-text-xs e-text-white">{memo}</span>
                </div>
            )}
        </div>
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
                        <p className="e-m-0">
                            Receipts can only be generated for transactions that only contain a single transfer.
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
