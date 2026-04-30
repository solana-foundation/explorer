'use client';

// TODO: encodeTransactionData is generic byte encoding — move to a shared entity (e.g. @shared/bytes)
import { type ByteArray, encodeTransactionData as encodeBytes, type EncodingFormat } from '@entities/transaction-data';
import { Button } from '@shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/dropdown-menu';
import React from 'react';
import { Download } from 'react-feather';

import { Logger } from '@/app/shared/lib/logger';
import { triggerDownloadText } from '@/app/shared/lib/triggerDownload';

const DEFAULT_ENCODINGS: EncodingFormat[] = ['hex', 'base58', 'base64'];

const DefaultTrigger = React.forwardRef<HTMLButtonElement, { disabled: boolean }>(({ disabled, ...props }, ref) => (
    <Button ref={ref} variant="outline" size="sm" aria-label="Download" disabled={disabled} {...props}>
        <Download size={12} />
        <span className="e-hidden md:e-inline">Download</span>
    </Button>
));
DefaultTrigger.displayName = 'DefaultTrigger';

export function DownloadDropdown({
    data,
    loading = false,
    disabled = false,
    error,
    filename,
    encodings = DEFAULT_ENCODINGS,
    onOpenChange,
    children,
}: {
    data: ByteArray | undefined;
    loading?: boolean;
    disabled?: boolean;
    error?: Error;
    filename: string;
    encodings?: EncodingFormat[];
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}) {
    const hasMoreThanOneEncoding = encodings.length > 1;

    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger
                asChild
                onClick={
                    hasMoreThanOneEncoding || !data ? undefined : () => handleDownload(data, encodings[0], filename)
                }
            >
                {children ?? <DefaultTrigger disabled={(!hasMoreThanOneEncoding && loading) || disabled} />}
            </DropdownMenuTrigger>
            {hasMoreThanOneEncoding && (
                <DropdownMenuContent align="end">
                    {error ? (
                        <DropdownMenuItem disabled>Failed to load data</DropdownMenuItem>
                    ) : (
                        encodings.map(encoding => (
                            <DropdownMenuItem
                                key={encoding}
                                disabled={loading || !data}
                                onClick={() => data && handleDownload(data, encoding, filename)}
                            >
                                {loading ? `Loading ${encoding}…` : `Download ${encoding}`}
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    );
}

function handleDownload(data: ByteArray, encoding: EncodingFormat, filename: string) {
    try {
        const encoded = encodeBytes(data, encoding);
        triggerDownloadText(encoded, `${filename}_${encoding}.txt`);
    } catch (err) {
        Logger.error(new Error(`Failed to download ${encoding} file`, { cause: err }));
    }
}
