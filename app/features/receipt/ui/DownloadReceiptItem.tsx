'use client';

import type { ReactNode } from 'react';
import { Check, Loader, XCircle } from 'react-feather';

import { useDownloadReceipt } from '../lib/use-download-receipt';
import type { DownloadReceiptFn } from '../types';
import { PopoverMenuItem } from './PopoverMenuItem';

interface DownloadReceiptItemProps {
    icon?: ReactNode;
    label: string;
    download: DownloadReceiptFn;
}

export function DownloadReceiptItem({ icon, label, download }: DownloadReceiptItemProps) {
    const [state, trigger] = useDownloadReceipt(download);

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

    return <PopoverMenuItem icon={getIcon()} label={getLabel()} onClick={trigger} />;
}
