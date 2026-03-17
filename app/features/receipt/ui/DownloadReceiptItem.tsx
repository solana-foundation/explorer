'use client';

import type { TransactionSignature } from '@solana/web3.js';
import type { ReactNode } from 'react';
import { Check, Loader, XCircle } from 'react-feather';

import { receiptAnalytics } from '@/app/shared/lib/analytics';

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
    function getIcon() {
        if (state === 'downloading') return <Loader size={11} className="e-animate-spin" />;
        if (state === 'downloaded') return <Check size={11} />;
        if (state === 'errored') return <XCircle size={11} />;
        return icon;
    }

    function getLabel() {
        if (state === 'downloading') return 'Downloading...';
        if (state === 'downloaded') return 'Downloaded!';
        if (state === 'errored') return 'Failed';
        return label;
    }

    return <PopoverMenuItem icon={getIcon()} label={getLabel()} onClick={onTrigger} />;
}

interface DownloadReceiptItemProps {
    icon?: ReactNode;
    label: string;
    download: DownloadReceiptFn;
    signature: TransactionSignature;
}

export function DownloadReceiptItem({ icon, label, download, signature }: DownloadReceiptItemProps) {
    const [state, trigger] = useDownloadReceipt(download);

    function handleTrigger() {
        receiptAnalytics.trackDownload(signature);
        trigger();
    }

    return <DownloadReceiptItemBase icon={icon} label={label} state={state} onTrigger={handleTrigger} />;
}
