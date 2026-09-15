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

// Above this size the tab bodies say "too large" instead of rendering the payload, and no inline
// string is built for it. Copy and Download still serve it, converting on demand.
const MAX_INLINE_BYTES = 1024;

const LOAD_FAILED = 'Failed to load account data.';

export type RawDataFieldProps = {
    data: ByteArray | undefined;
    error?: Error;
    loading?: boolean;
    filename: string;
    extraButton?: React.ReactNode;
};

export function RawDataField({ data, error, loading, filename, extraButton }: RawDataFieldProps) {
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

    const view = viewState({ data, error, loading });
    const bytes = 'data' in view ? view.data : undefined;
    const hasData = view.kind === 'ready' || view.kind === 'tooLarge';
    const failure = view.kind === 'failed' ? view.error : undefined;

    useEffect(() => {
        setExpanded(false);
    }, [bytes]);

    const inlineBytes = view.kind === 'ready' ? view.data : undefined;
    const base64String = useMemo(() => (inlineBytes ? toBase64(new Uint8Array(inlineBytes)) : ''), [inlineBytes]);

    const hasMoreHex = bytes !== undefined && bytes.length > VISIBLE_ROWS * HEX_ROW_BYTES;
    const visibleData =
        bytes !== undefined && !expanded && hasMoreHex ? bytes.subarray(0, VISIBLE_ROWS * HEX_ROW_BYTES) : bytes;

    const hasMoreBase64 = base64String.length > BASE64_VISIBLE_CHARS;
    const visibleBase64 = expanded ? base64String : base64String.slice(0, BASE64_VISIBLE_CHARS);

    const hasMore = (tab === 'hex' && hasMoreHex) || (tab === 'base64' && hasMoreBase64);

    const handleCopy = () => {
        if (bytes === undefined) return;
        copy(tab === 'base64' ? toBase64(new Uint8Array(bytes)) : toHex(bytes));
    };

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
                    {bytes !== undefined && (
                        <span className="whitespace-nowrap text-xs text-outer-space-300">{bytes.length} bytes</span>
                    )}
                    {Boolean(extraButton) && extraButton}
                    <Button variant="outline" size="sm" aria-label="Copy" disabled={!hasData} onClick={handleCopy}>
                        {copyState === 'copied' ? <Check size={12} /> : <Copy size={12} />}
                        <span className="hidden md:inline">{copyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                    <DownloadDropdown
                        filename={filename}
                        data={bytes}
                        error={failure}
                        loading={view.kind === 'loading'}
                        disabled={!hasData}
                        encodings={[tab]}
                        onDownload={() => setDownloadState(DownloadState.Downloaded)}
                    >
                        <Button variant="outline" size="sm" aria-label="Download" disabled={!hasData}>
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
                className={cn(
                    'max-h-80 overflow-y-auto p-1.5 text-start',
                    view.kind === 'loading' && 'p-3',
                    view.kind === 'tooLarge' && 'px-3 py-2',
                )}
            >
                {view.kind === 'loading' ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : view.kind === 'failed' ? (
                    <span className="text-sm text-outer-space-200">{LOAD_FAILED}</span>
                ) : view.kind === 'tooLarge' ? (
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

            <TabsContent value="base64" className={cn('max-h-80 overflow-y-auto p-3 text-start', hasData && 'py-2')}>
                {view.kind === 'loading' ? (
                    <span className="spinner-grow spinner-grow-sm" />
                ) : view.kind === 'failed' ? (
                    <span className="text-sm text-outer-space-200">{LOAD_FAILED}</span>
                ) : !hasData ? (
                    <span className="text-sm text-outer-space-200">No data</span>
                ) : view.kind === 'tooLarge' ? (
                    <span className="text-sm text-outer-space-200">Too large to display - use download/copy.</span>
                ) : (
                    <span className="text-wrap break-all font-mono text-xs text-white">
                        {visibleBase64}
                        {!expanded && hasMoreBase64 && '…'}
                    </span>
                )}
            </TabsContent>

            {hasMore && view.kind === 'ready' && (
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

type ViewState =
    | { kind: 'loading' }
    | { error: Error; kind: 'failed' }
    | { kind: 'idle' }
    | { data: ByteArray; kind: 'empty' }
    | { data: ByteArray; kind: 'tooLarge' }
    | { data: ByteArray; kind: 'ready' };

// One answer for the toolbar, both tab bodies and the expander. A caller that fetches on open has
// nowhere else to report a failure, but bytes in hand outrank one — they still copy and download.
function viewState({ data, error, loading }: Pick<RawDataFieldProps, 'data' | 'error' | 'loading'>): ViewState {
    if (loading) return { kind: 'loading' };
    if (data === undefined) return error !== undefined ? { error, kind: 'failed' } : { kind: 'idle' };
    if (data.length === 0) return { data, kind: 'empty' };
    return data.length > MAX_INLINE_BYTES ? { data, kind: 'tooLarge' } : { data, kind: 'ready' };
}
