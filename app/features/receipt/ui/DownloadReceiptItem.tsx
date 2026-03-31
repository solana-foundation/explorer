'use client';

import type { TransactionSignature } from '@solana/web3.js';
import type { ReactNode } from 'react';

import { EReceiptDownloadFormat, receiptAnalytics } from '@/app/shared/lib/analytics';

import { type DownloadState, useDownloadReceipt } from '../model/use-download-receipt';
import type { DownloadReceiptFn } from '../types';
import { PopoverMenuItem } from './PopoverMenuItem';

interface DownloadReceiptItemBaseProps {
    icon?: ReactNode;
    label: string;
    state: DownloadState;
    onTrigger: () => void;
}

export function DownloadReceiptItemBase({ icon, label, state, onTrigger }: DownloadReceiptItemBaseProps) {
    const isDownloading = state === 'downloading';

    function getIcon() {
        if (isDownloading) return <span className="e-spinner-grow e-spinner-grow-xs e-mx-0.5" aria-hidden="true" />;
        return icon;
    }

    return <PopoverMenuItem disabled={isDownloading} icon={getIcon()} label={`Get ${label}`} onClick={onTrigger} />;
}

interface DownloadReceiptItemProps {
    icon?: ReactNode;
    label: string;
    download: DownloadReceiptFn;
    format: EReceiptDownloadFormat;
    signature: TransactionSignature;
}

export function DownloadReceiptItem({ icon, label, download, format, signature }: DownloadReceiptItemProps) {
    const [state, trigger] = useDownloadReceipt(download);

    function handleTrigger() {
        receiptAnalytics.trackDownload(signature, format);
        trigger();
    }

    return <DownloadReceiptItemBase icon={icon} label={label} state={state} onTrigger={handleTrigger} />;
}
