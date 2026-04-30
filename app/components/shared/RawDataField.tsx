'use client';

import { HexData } from '@shared/HexData';
import { Button } from '@shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import React, { useState } from 'react';
import { ChevronDown, Copy } from 'react-feather';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { type ByteArray, toBase64, toHex } from '@/app/shared/lib/bytes';
import { useCopyToClipboard } from '@/app/shared/lib/useCopyToClipboard';

import { cn } from './utils';

// Must match HexData's ROW_SIZE (4 spans × 6 bytes each).
const HEX_ROW_BYTES = 24;
const VISIBLE_ROWS = 3;

const BASE64_VISIBLE_CHARS = 192;

export type RawDataFieldProps = {
    data: ByteArray | undefined;
    loading?: boolean;
    filename: string;
};

export function RawDataField({ data, loading, filename }: RawDataFieldProps) {
    const [tab, setTab] = useState<'hex' | 'base64'>('hex');
    const [expanded, setExpanded] = useState(false);
    const [copyState, copy] = useCopyToClipboard();

    const hexString = data && data.length > 0 ? toHex(data) : '';
    const base64String = data && data.length > 0 ? toBase64(new Uint8Array(data)) : '';

    const hasMoreHex = data !== undefined && data.length > VISIBLE_ROWS * HEX_ROW_BYTES;
    const visibleData = !expanded && hasMoreHex ? data.subarray(0, VISIBLE_ROWS * HEX_ROW_BYTES) : data;

    const hasMoreBase64 = base64String.length > BASE64_VISIBLE_CHARS;
    const visibleBase64 = expanded ? base64String : base64String.slice(0, BASE64_VISIBLE_CHARS);

    const hasMore = (tab === 'hex' && hasMoreHex) || (tab === 'base64' && hasMoreBase64);

    const handleTabChange = (value: string) => {
        setTab(value as 'hex' | 'base64');
        setExpanded(false);
    };

    return (
        <Tabs
            value={tab}
            onValueChange={handleTabChange}
            className="e-max-w-[540px] e-overflow-hidden e-rounded-lg e-border e-border-solid e-border-outer-space-800 e-bg-heavy-metal-900"
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
                        disabled={!data || !data.length || loading}
                        onClick={() => copy(tab === 'base64' ? base64String : hexString)}
                    >
                        <Copy size={12} />
                        <span className="e-hidden md:e-inline">{copyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <DownloadDropdown
                        filename={filename}
                        data={data}
                        loading={loading}
                        disabled={!data || !data.length}
                        encodings={[tab]}
                    />
                </div>
            </div>

            <TabsContent value="hex" className={cn('e-text-start', loading ? 'e-p-3' : 'e-p-1.5')}>
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
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

            <TabsContent value="base64" className={cn('e-p-3 e-text-start', !loading && data?.length && 'e-py-2')}>
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : !data || data.length === 0 ? (
                    <span className="e-text-sm e-text-outer-space-200">No data</span>
                ) : (
                    <span className="e-text-wrap e-break-all e-font-mono e-text-xs e-text-white">
                        {visibleBase64}
                        {!expanded && hasMoreBase64 && '…'}
                    </span>
                )}
            </TabsContent>

            {hasMore && !loading && data && data.length > 0 && (
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
