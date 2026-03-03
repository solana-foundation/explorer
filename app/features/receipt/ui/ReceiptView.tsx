'use client';

import { Button } from '@components/shared/ui/button';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';

import { receiptAnalytics } from '@/app/shared/lib/analytics';

import type { FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { BaseShareButton } from './BaseShareButton';
import { CopyLinkShareItem } from './CopyLinkShareItem';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    signature: TransactionSignature;
    transactionPath: string;
}

export function ReceiptView({ data, signature, transactionPath }: ReceiptViewProps) {
    function handleViewTxClick() {
        receiptAnalytics.trackViewTxClicked(signature);
    }

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
                <BaseShareButton>
                    <CopyLinkShareItem />
                </BaseShareButton>
            </div>
        </div>
    );
}
