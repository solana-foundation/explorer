// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
'use client';

import { HexData } from '@components/shared/HexData';
import { Button } from '@components/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/shared/ui/tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Download } from 'react-feather';

import { DownloadDropdown, DownloadState } from '@/app/shared/components/DownloadDropdown';
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
    const [downloadState, setDownloadState] = useState<DownloadState>(DownloadState.Idle);

    useEffect(() => {
        if (downloadState === DownloadState.Downloaded) {
            const t = setTimeout(() => setDownloadState(DownloadState.Idle), 1000);
            return () => clearTimeout(t);
        }
    }, [downloadState]);

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
            className="max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-solid border-outer-space-800 bg-heavy-metal-900 lg:max-w-[540px]"
        >
            <div className="flex flex-wrap justify-between gap-8 border-b border-outer-space-800 px-3 [border-bottom-style:solid]">
                <TabsList>
                    <TabsTrigger className="!py-2 text-xs" value="hex">
                        Hex
                    </TabsTrigger>
                    <TabsTrigger className="!py-2 text-xs" value="base64">
                        Base64
                    </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                    {data !== undefined && !loading && (
                        <span className="whitespace-nowrap text-xs text-outer-space-300">{data.length} bytes</span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        aria-label="Copy"
                        disabled={!hasData || loading}
                        onClick={() => copy(tab === 'base64' ? base64String : hexString)}
                    >
                        {copyState === 'copied' ? <Check size={12} /> : <Copy size={12} />}
                        <span className="hidden md:inline">{copyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <DownloadDropdown
                        filename={filename}
                        data={data}
                        loading={loading}
                        disabled={!hasData}
                        encodings={[tab]}
                        onDownload={() => setDownloadState(DownloadState.Downloaded)}
                    >
                        <Button variant="outline" size="sm" aria-label="Download" disabled={!hasData || loading}>
                            {downloadState === DownloadState.Downloaded ? <Check size={12} /> : <Download size={12} />}
                            <span className="hidden md:inline">
                                {downloadState === DownloadState.Downloaded ? 'Downloaded!' : 'Download'}
                            </span>
                        </Button>
                    </DownloadDropdown>
                </div>
            </div>

            <TabsContent
                value="hex"
                className={cn('max-h-80 overflow-y-auto p-1.5 text-start', loading && 'p-3', tooLarge && 'px-3 py-2')}
            >
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : tooLarge ? (
                    <span className="text-sm text-outer-space-200">Too large to display - use download/copy.</span>
                ) : (
                    <HexData
                        className="w-full"
                        raw={visibleData ?? new Uint8Array(0)}
                        isCopyable={false}
                        rowSize={HEX_ROW_BYTES}
                        align="start"
                    />
                )}
            </TabsContent>

            <TabsContent
                value="base64"
                className={cn('max-h-80 overflow-y-auto p-3 text-start', !loading && data?.length && 'py-2')}
            >
                {loading ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : !hasData ? (
                    <span className="text-sm text-outer-space-200">No data</span>
                ) : tooLarge ? (
                    <span className="text-sm text-outer-space-200">Too large to display - use download/copy.</span>
                ) : (
                    <span className="text-wrap break-all font-mono text-xs text-white">
                        {visibleBase64}
                        {!expanded && hasMoreBase64 && '…'}
                    </span>
                )}
            </TabsContent>

            {hasMore && !tooLarge && !loading && hasData && (
                <div className="mt-1 flex justify-center border-t border-outer-space-800 [border-top-style:solid]">
                    <Button
                        variant="ghost"
                        className="hover:!bg-transparent"
                        size="sm"
                        onClick={() => setExpanded(e => !e)}
                    >
                        <span className="text-xs text-outer-space-300">{expanded ? 'Show less' : 'Show more'}</span>
                        <ChevronDown
                            size={14}
                            className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                        />
                    </Button>
                </div>
            )}
        </Tabs>
    );
}
