'use client';

// TODO: encodeTransactionData is generic byte encoding — move to a shared entity (e.g. @shared/bytes)
import { Button } from '@components/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@components/shared/ui/dropdown-menu';
import { type ByteArray, encodeTransactionData as encodeBytes, type EncodingFormat } from '@entities/transaction-data';
import React from 'react';
import { Download } from 'react-feather';

import { Logger } from '@/app/shared/lib/logger';
import { triggerDownloadText } from '@/app/shared/lib/triggerDownload';

const DEFAULT_ENCODINGS: EncodingFormat[] = ['hex', 'base58', 'base64'];

const DefaultTrigger = React.forwardRef<HTMLButtonElement, { disabled: boolean }>(({ disabled, ...props }, ref) => (
    <Button ref={ref} variant="outline" size="sm" aria-label="Download" disabled={disabled} {...props}>
        <Download size={12} />
        <span className="hidden md:inline">Download</span>
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
    if (encodings.length <= 1) {
        const trigger = children ?? <DefaultTrigger disabled={loading || disabled} />;
        if (React.isValidElement(trigger)) {
            return React.cloneElement(trigger as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>, {
                onClick: () => data && handleDownload(data, encodings[0], filename),
            });
        }
        return trigger;
    }

    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>{children ?? <DefaultTrigger disabled={disabled} />}</DropdownMenuTrigger>
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
