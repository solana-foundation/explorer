'use client';

import type { TransactionSignature } from '@solana/web3.js';
import type { ReactNode } from 'react';

import { EReceiptDownloadFormat, receiptAnalytics } from '@/app/shared/lib/analytics';

import { type DownloadState, useDownloadReceipt } from '../model/use-download-receipt';
import type { DownloadReceiptFn } from '../types';
import { PopoverMenuItem } from './PopoverMenuItem';

interface DownloadReceiptItemBaseProps {
    disabled?: boolean;
    icon?: ReactNode;
    label: string;
    state: DownloadState;
    onTrigger: () => void;
}

export function DownloadReceiptItemBase({ disabled, icon, label, state, onTrigger }: DownloadReceiptItemBaseProps) {
    const isDownloading = state === 'downloading';

    function getIcon() {
        if (isDownloading) return <span className="e-spinner-grow e-spinner-grow-xs e-mx-0.5" aria-hidden="true" />;
        return icon;
    }

    return (
        <PopoverMenuItem
            disabled={disabled || isDownloading}
            icon={getIcon()}
            label={`Get ${label}`}
            onClick={onTrigger}
        />
    );
}

interface DownloadReceiptItemProps {
    disabled?: boolean;
    icon?: ReactNode;
    label: string;
    download: DownloadReceiptFn;
    format: EReceiptDownloadFormat;
    signature: TransactionSignature;
    onError?: (error: unknown) => void;
}

export function DownloadReceiptItem({
    disabled,
    icon,
    label,
    download,
    format,
    signature,
    onError,
}: DownloadReceiptItemProps) {
    const [state, trigger] = useDownloadReceipt(download, undefined, onError);

    function handleTrigger() {
        receiptAnalytics.trackDownload(signature, format);
        trigger();
    }

    return (
        <DownloadReceiptItemBase
            disabled={disabled}
            icon={icon}
            label={label}
            state={state}
            onTrigger={handleTrigger}
        />
    );
}
