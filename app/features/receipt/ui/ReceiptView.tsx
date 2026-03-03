'use client';

import { Button } from '@components/shared/ui/button';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { receiptAnalytics } from '@/app/shared/lib/analytics';

import type { FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { BaseShareButton } from './BaseShareButton';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    signature: string;
    transactionPath: string;
}

export function ReceiptView({ data, signature, transactionPath }: ReceiptViewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const handleViewTxClick = useCallback(() => {
        receiptAnalytics.trackViewTxClicked(signature);
    }, [signature]);

    return (
        <div className="container e-flex e-min-h-[90vh] e-min-w-[390px] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />
            <BaseReceipt data={data} />
            <div className="e-flex e-items-start e-gap-0.5">
                <Button variant="compact" size="compact" asChild>
                    <Link href={transactionPath} target="_blank" rel="noopener noreferrer" onClick={handleViewTxClick}>
                        Open transaction in Explorer
                    </Link>
                </Button>
                <BaseShareButton copied={copied} onCopyLink={handleCopyLink} />
            </div>
        </div>
    );
}
