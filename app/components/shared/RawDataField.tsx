'use client';

import { HexData } from '@shared/HexData';
import { Button } from '@shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Copy } from 'react-feather';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { type ByteArray, toBase64, toHex } from '@/app/shared/lib/bytes';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { cn } from './utils';

// Must match HexData's default spanSize (4 bytes). 6 spans × 4 bytes = 24 bytes per row.
const HEX_ROW_BYTES = 24;
const VISIBLE_ROWS = 3;

const BASE64_VISIBLE_CHARS = 192;

// Inline string conversion (hex/base64) is skipped above this threshold.
// Copy is disabled, use the download button for large payloads.
const MAX_INLINE_BYTES = 1024;

export type RawDataFieldProps = {
    data: ByteArray | undefined;
    loading?: boolean;
    filename: string;
};

export function RawDataField({ data, loading, filename }: RawDataFieldProps) {
    const [tab, setTab] = useState<'hex' | 'base64'>('hex');
    const [expanded, setExpanded] = useState(false);
    const [copyState, copy] = useCopyToClipboard();

    useEffect(() => {
        setExpanded(false);
    }, [data]);

    const hasData = data !== undefined && data.length > 0;
    const tooLarge = data !== undefined && data.length > MAX_INLINE_BYTES;

    const hexString = useMemo(() => (data && data.length > 0 ? toHex(data) : ''), [data]);
    const base64String = useMemo(() => (data && data.length > 0 ? toBase64(new Uint8Array(data)) : ''), [data]);

    const hasMoreHex = data !== undefined && data.length > VISIBLE_ROWS * HEX_ROW_BYTES;
    const visibleData = !expanded && hasMoreHex ? data.subarray(0, VISIBLE_ROWS * HEX_ROW_BYTES) : data;

    const hasMoreBase64 = base64String.length > BASE64_VISIBLE_CHARS;
    const visibleBase64 = expanded ? base64String : base64String.slice(0, BASE64_VISIBLE_CHARS);

    const hasMore = (tab === 'hex' && hasMoreHex) || (tab === 'base64' && hasMoreBase64);

    const handleTabChange = (value: string) => {
        if (value === 'hex' || value === 'base64') {
            if (value !== tab) setExpanded(false);
            setTab(value);
        }
    };

    return (
        <Tabs
            value={tab}
            onValueChange={handleTabChange}
            // we need to do -32px because this is padding for left and right 16px
            className="e-max-w-[calc(100vw-32px)] e-overflow-hidden e-rounded-lg e-border e-border-solid e-border-outer-space-800 e-bg-heavy-metal-900 lg:e-max-w-[540px]"
        >
            <div className="e-flex e-flex-wrap e-justify-between e-gap-8 e-border-b e-border-outer-space-800 e-px-3 [border-bottom-style:solid]">
                <TabsList>
                    <TabsTrigger className="!e-py-2 e-text-xs" value="hex">
                        Hex
                    </TabsTrigger>
                    <TabsTrigger className="!e-py-2 e-text-xs" value="base64">
                        Base64
                    </TabsTrigger>
                </TabsList>
                <div className="e-flex e-items-center e-gap-2">
                    {data !== undefined && !loading && (
                        <span className="e-whitespace-nowrap e-text-xs e-text-outer-space-300">
                            {data.length} bytes
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        aria-label="Copy"
                        disabled={!hasData || loading}
                        onClick={() => copy(tab === 'base64' ? base64String : hexString)}
                    >
                        {copyState === 'copied' ? <Check size={12} /> : <Copy size={12} />}
                        <span className="e-hidden md:e-inline">{copyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <DownloadDropdown
                        filename={filename}
                        data={data}
                        loading={loading}
                        disabled={!hasData}
                        encodings={[tab]}
                    />
                </div>
            </div>

            <TabsContent
                value="hex"
                className={cn(
                    'e-max-h-80 e-overflow-y-auto e-p-1.5 e-text-start',
                    loading && 'e-p-3',
                    tooLarge && 'e-px-3 e-py-2',
                )}
            >
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : tooLarge ? (
                    <span className="e-text-sm e-text-outer-space-200">Too large to display - use download/copy.</span>
                ) : (
                    <HexData
                        className="e-w-full"
                        raw={visibleData ?? new Uint8Array(0)}
                        isCopyable={false}
                        rowSize={HEX_ROW_BYTES}
                        align="start"
                    />
                )}
            </TabsContent>

            <TabsContent
                value="base64"
                className={cn('e-max-h-80 e-overflow-y-auto e-p-3 e-text-start', !loading && data?.length && 'e-py-2')}
            >
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : !hasData ? (
                    <span className="e-text-sm e-text-outer-space-200">No data</span>
                ) : tooLarge ? (
                    <span className="e-text-sm e-text-outer-space-200">Too large to display - use download/copy.</span>
                ) : (
                    <span className="e-text-wrap e-break-all e-font-mono e-text-xs e-text-white">
                        {visibleBase64}
                        {!expanded && hasMoreBase64 && '…'}
                    </span>
                )}
            </TabsContent>

            {hasMore && !tooLarge && !loading && hasData && (
                <div className="e-mt-1 e-flex e-justify-center e-border-t e-border-outer-space-800 [border-top-style:solid]">
                    <Button
                        variant="ghost"
                        className="hover:!e-bg-transparent"
                        size="sm"
                        onClick={() => setExpanded(e => !e)}
                    >
                        <span className="e-text-xs e-text-outer-space-300">{expanded ? 'Show less' : 'Show more'}</span>
                        <ChevronDown
                            size={14}
                            className={expanded ? 'e-rotate-180 e-transition-transform' : 'e-transition-transform'}
                        />
                    </Button>
                </div>
            )}
        </Tabs>
    );
}
