'use client';

import { Button } from '@components/shared/ui/button';
import * as Sentry from '@sentry/nextjs';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Share2 } from 'react-feather';

import { receiptAnalytics } from '@/app/shared/lib/analytics';

import type { FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { CopyLinkShareItem } from './CopyLinkShareItem';
import { PopoverButton } from './PopoverButton';
import { ShareOnXShareItem } from './ShareOnXShareItem';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    signature: TransactionSignature;
    transactionPath: string;
}

export function ReceiptView({ data, signature, transactionPath }: ReceiptViewProps) {
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasNoHover = window.matchMedia('(hover: none)').matches;

        setCanNativeShare(typeof navigator.share === 'function' && hasCoarsePointer && hasNoHover);
    }, []);

    function handleViewTxClick() {
        receiptAnalytics.trackViewTxClicked(signature);
    }

    async function handleNativeShare() {
        try {
            await navigator.share({ url: globalThis.location.href });
            receiptAnalytics.trackShareNative(signature);
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') return;
            Sentry.captureException(e);
        }
    }

    return (
        <div className="container e-flex e-min-h-[90vh] e-min-w-[390px] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />
            <BaseReceipt data={data} />
            <div className="e-flex e-flex-col e-items-center e-gap-0.5 sm:e-flex-row">
                <div className="e-flex e-items-start e-gap-0.5">
                    <Button variant="compact" size="compact" asChild>
                        <Link
                            href={transactionPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleViewTxClick}
                        >
                            Open transaction in Explorer
                        </Link>
                    </Button>
                </div>
                <div className="e-flex e-items-start e-gap-0.5">
                    {canNativeShare ? (
                        <Button variant="compact" size="compact" onClick={handleNativeShare} className="e-max-h-[25px]">
                            <Share2 size={12} />
                            Share
                        </Button>
                    ) : (
                        <PopoverButton icon={<Share2 size={12} />} label="Share" className="e-max-h-[25px]">
                            <ShareOnXShareItem onShare={() => receiptAnalytics.trackShareOnX(signature)} />
                            <CopyLinkShareItem onCopy={() => receiptAnalytics.trackShareCopyLink(signature)} />
                        </PopoverButton>
                    )}
                </div>
            </div>
        </div>
    );
}
