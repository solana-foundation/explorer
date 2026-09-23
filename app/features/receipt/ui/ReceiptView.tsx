'use client';

import { Button } from '@components/shared/ui/button';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';
import { ChevronDown, Download, FileText, Share2, Table } from 'react-feather';

import { useToast } from '@/app/components/shared/ui/sonner/use-toast';
import { EReceiptDownloadFormat, receiptAnalytics } from '@/app/shared/lib/analytics';
import { useCanNativeShare } from '@/app/shared/lib/use-can-native-share';
import { NormalizedChevronLeft } from '@/app/shared/ui/icons/normalized';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

import type { DownloadReceiptFn, FormattedExtendedReceipt } from '../types';
import { BaseReceipt, BlurredCircle } from './BaseReceipt';
import { CopyLinkShareItem } from './CopyLinkShareItem';
import { DownloadReceiptItem } from './DownloadReceiptItem';
import { PopoverButton } from './PopoverButton';
import { ShareOnXShareItem } from './ShareOnXShareItem';

interface ReceiptViewProps {
    data: FormattedExtendedReceipt;
    downloadCsv: DownloadReceiptFn;
    downloadPdf: DownloadReceiptFn;
    isPriceLoading?: boolean;
    signature: TransactionSignature;
    transactionPath: string;
}

export function ReceiptView({
    data,
    downloadCsv,
    downloadPdf,
    isPriceLoading,
    signature,
    transactionPath,
}: ReceiptViewProps) {
    const canNativeShare = useCanNativeShare();
    const toast = useToast();

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
                return;
            }
            toast.custom({ title: 'Failed to share', type: 'error' });
        }
    }

    return (
        <PageContainer className="flex min-h-[80vh] min-w-[theme(screens.xs)] flex-col items-center justify-start gap-4 pb-10 pt-4 sm:justify-center sm:pt-10">
            <BlurredCircle />
            {/* Actions sit above the receipt and share its width: back on the left, share/download on the right. */}
            <div className="flex w-full max-w-lg flex-row items-center justify-between gap-2">
                <Button variant="quiet" size="toolbar" asChild>
                    {/* Same-tab navigation on purpose: this is the page's back affordance, not a side trip. */}
                    <Link href={transactionPath} onClick={handleViewTxClick}>
                        <NormalizedChevronLeft className="-mr-1" />
                        Transaction
                    </Link>
                </Button>
                <div className="flex flex-row items-center gap-4">
                    <PopoverButton
                        align="end"
                        caret={<ChevronDown size={16} aria-hidden="true" className="-ml-1" />}
                        variant="quiet"
                        size="toolbar"
                        icon={<Download size={16} />}
                        label="Download"
                        loading={isPriceLoading}
                    >
                        <DownloadReceiptItem
                            icon={<Table size={16} />}
                            format={EReceiptDownloadFormat.Csv}
                            label="CSV"
                            download={downloadCsv}
                            signature={signature}
                            onError={() => toast.custom({ title: 'Failed to download receipt CSV', type: 'error' })}
                        />
                        <DownloadReceiptItem
                            icon={<FileText size={16} />}
                            format={EReceiptDownloadFormat.Pdf}
                            label="PDF"
                            download={downloadPdf}
                            signature={signature}
                            onError={() => toast.custom({ title: 'Failed to download receipt PDF', type: 'error' })}
                        />
                    </PopoverButton>
                    {canNativeShare ? (
                        <Button variant="quiet" size="toolbar" onClick={handleNativeShare}>
                            <Share2 size={16} aria-hidden="true" />
                            Share
                        </Button>
                    ) : (
                        <PopoverButton
                            align="end"
                            caret={<ChevronDown size={16} aria-hidden="true" className="-ml-1" />}
                            variant="quiet"
                            size="toolbar"
                            icon={<Share2 size={16} aria-hidden="true" />}
                            label="Share"
                        >
                            <ShareOnXShareItem onShare={() => receiptAnalytics.trackShareOnX(signature)} />
                            <CopyLinkShareItem onCopy={() => receiptAnalytics.trackShareCopyLink(signature)} />
                        </PopoverButton>
                    )}
                </div>
            </div>
            <BaseReceipt data={data} />
        </PageContainer>
    );
}
