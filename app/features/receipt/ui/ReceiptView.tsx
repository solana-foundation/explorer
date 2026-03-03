'use client';

import { Button } from '@components/shared/ui/button';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';
import { Download, Share2 } from 'react-feather';

import { receiptAnalytics } from '@/app/shared/lib/analytics';

import type { DownloadReceiptFn, FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { CopyLinkShareItem } from './CopyLinkShareItem';
import { DownloadReceiptItem } from './DownloadReceiptItem';
import { PopoverButton } from './PopoverButton';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    signature: TransactionSignature;
    transactionPath: string;
    download: DownloadReceiptFn;
}

export function ReceiptView({ data, signature, transactionPath, download }: ReceiptViewProps) {
    function handleViewTxClick() {
        receiptAnalytics.trackViewTxClicked(signature);
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
                    <PopoverButton icon={<Share2 size={12} />} label="Share">
                        <CopyLinkShareItem onCopy={() => receiptAnalytics.trackShareCopyLink(signature)} />
                    </PopoverButton>
                </div>
                <div className="e-flex e-items-start e-gap-0.5">
                    <PopoverButton icon={<Download size={12} />} label="Download">
                        <DownloadReceiptItem icon={<Download size={11} />} label="Download PNG" download={download} />
                    </PopoverButton>
                </div>
            </div>
        </div>
    );
}
