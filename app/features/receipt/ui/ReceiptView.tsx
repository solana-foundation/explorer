'use client';

import { Button } from '@components/shared/ui/button';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';
import { Download, Share2 } from 'react-feather';

import { useToast } from '@/app/components/shared/ui/sonner/use-toast';
import { receiptAnalytics } from '@/app/shared/lib/analytics';
import { useCanNativeShare } from '@/app/shared/lib/use-can-native-share';

import type { DownloadReceiptFn, FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { CopyLinkShareItem } from './CopyLinkShareItem';
import { DownloadReceiptItem } from './DownloadReceiptItem';
import { PopoverButton } from './PopoverButton';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    signature: TransactionSignature;
    transactionPath: string;
    downloadPdf: DownloadReceiptFn;
}

export function ReceiptView({ data, signature, transactionPath, downloadPdf }: ReceiptViewProps) {
    function handleViewTxClick() {
        receiptAnalytics.trackViewTxClicked(signature);
    }

    async function handleNativeShare() {
        try {
            const shareData = {
                title: 'Solana Transaction Receipt',
                url: globalThis.location.href,
            };

            if (!navigator.canShare?.(shareData)) {
                toast.custom({ title: 'Sharing not supported for this content', type: 'error' });
                return;
            }
            await navigator.share(shareData);
            receiptAnalytics.trackShareNative(signature);
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                // Dismissing the native share sheet is an expected cancel path, not a share failure.
                return;
            }
            toast.custom({ title: 'Failed to share', type: 'error' });
        }
    }

    return (
        <div className="container e-flex e-min-h-[90vh] e-min-w-[theme(screens.xs)] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
            <BlurredCircle />
            <BaseReceipt data={data} />
            <div className="e-flex e-flex-row e-items-center e-gap-1">
                <div className="e-flex e-items-start e-gap-0.5">
                    <Button variant="compact" size="compact" asChild>
                        <Link
                            href={transactionPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleViewTxClick}
                        >
                            View transaction in Explorer
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
                        <DownloadReceiptItem label="PDF" download={downloadPdf} signature={signature} />
                    </PopoverButton>
                </div>
            </div>
        </div>
    );
}
