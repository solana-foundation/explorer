'use client';

import { type ByteArray, encodeTransactionData, type EncodingFormat } from '@entities/transaction-data';
import { Button } from '@shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/dropdown-menu';
import React from 'react';
import { Download } from 'react-feather';

import { triggerDownloadText } from '@/app/shared/lib/triggerDownload';

const DEFAULT_ENCODINGS: EncodingFormat[] = ['hex', 'base58', 'base64'];

const DefaultTrigger = (
    <Button variant="outline" size="sm">
        <Download size={12} />
        Download
    </Button>
);

export function DownloadDropdown({
    data,
    loading = false,
    error,
    filename,
    encodings = DEFAULT_ENCODINGS,
    onOpenChange,
    children,
}: {
    data: ByteArray | undefined;
    loading?: boolean;
    error?: Error;
    filename: string;
    encodings?: EncodingFormat[];
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}) {
    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>{children ?? DefaultTrigger}</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {error ? (
                    <DropdownMenuItem disabled>Failed to load data</DropdownMenuItem>
                ) : (
                    encodings.map(encoding => (
                        <DropdownMenuItem
                            key={encoding}
                            disabled={!data}
                            onClick={() => data && handleDownload(data, encoding, filename)}
                        >
                            {loading ? `Loading ${encoding}…` : `Download ${encoding}`}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function handleDownload(data: ByteArray, encoding: EncodingFormat, filename: string) {
    const encoded = encodeTransactionData(data, encoding);
    triggerDownloadText(encoded, `${filename}_${encoding}.txt`);
}
