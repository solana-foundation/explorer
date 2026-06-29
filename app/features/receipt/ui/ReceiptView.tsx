'use client';

import { Button } from '@components/shared/ui/button';
import { TransactionSignature } from '@solana/web3.js';
import Link from 'next/link';
import { Download, FileText, Share2, Table } from 'react-feather';

import { useToast } from '@/app/components/shared/ui/sonner/use-toast';
import { EReceiptDownloadFormat, receiptAnalytics } from '@/app/shared/lib/analytics';
import { useCanNativeShare } from '@/app/shared/lib/use-can-native-share';
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
        <PageContainer className="flex min-h-[80vh] min-w-[theme(screens.xs)] flex-col items-center justify-center gap-6 px-5 py-10">
            <BlurredCircle />
            <BaseReceipt data={data} />
            <div className="flex flex-row items-center gap-1">
                <div className="flex items-start gap-0.5">
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
                <div className="flex items-start gap-0.5">
                    {canNativeShare ? (
                        <Button variant="compact" size="compact" onClick={handleNativeShare} className="max-h-[25px]">
                            <Share2 size={12} aria-hidden="true" />
                            Share
                        </Button>
                    ) : (
                        <PopoverButton
                            icon={<Share2 size={12} aria-hidden="true" />}
                            label="Share"
                            className="max-h-[25px]"
                        >
                            <ShareOnXShareItem onShare={() => receiptAnalytics.trackShareOnX(signature)} />
                            <CopyLinkShareItem onCopy={() => receiptAnalytics.trackShareCopyLink(signature)} />
                        </PopoverButton>
                    )}
                </div>
                <div className="flex items-start gap-0.5">
                    <PopoverButton
                        icon={<Download size={12} />}
                        label="Download"
                        loading={isPriceLoading}
                        className="max-h-[25px]"
                    >
                        <DownloadReceiptItem
                            icon={<Table size={12} />}
                            format={EReceiptDownloadFormat.Csv}
                            label="CSV"
                            download={downloadCsv}
                            signature={signature}
                            onError={() => toast.custom({ title: 'Failed to download receipt CSV', type: 'error' })}
                        />
                        <DownloadReceiptItem
                            icon={<FileText size={12} />}
                            format={EReceiptDownloadFormat.Pdf}
                            label="PDF"
                            download={downloadPdf}
                            signature={signature}
                            onError={() => toast.custom({ title: 'Failed to download receipt PDF', type: 'error' })}
                        />
                    </PopoverButton>
                </div>
            </div>
        </PageContainer>
    );
}
