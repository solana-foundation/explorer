import { RawDataField } from '@components/shared/RawDataField';
import {
    decodePmpPayload,
    PMP_COMPRESSED_BYTES_LABELS,
    PMP_UNCOMPRESSED_BYTES_LABEL,
    type PmpAccountDecodeResult,
    type PmpPayloadDecodeResult,
} from '@entities/pmp-account';
import { PublicKey } from '@solana/web3.js';
import { Compression, DataSource } from '@solana-program/program-metadata';
import React from 'react';

import { Address } from '@/app/components/common/Address';
import { Copyable } from '@/app/components/common/Copyable';
import { Badge } from '@/app/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/shared/ui/tabs';
import { Alert } from '@/app/shared/ui/Alert';
import { BaseTable } from '@/app/shared/ui/Table';

import { pmpAnalytics } from '../lib/analytics';
import {
    PMP_ACCOUNT_RAW_DOWNLOAD_FILENAME,
    PMP_ANALYTICS_IX_NAMES,
    PMP_DATA_SOURCE_ANALYTICS_NAMES,
    PMP_DECODED_DOWNLOAD_FILENAME,
    PMP_FORMAT_ANALYTICS_NAMES,
    PMP_RAW_DOWNLOAD_FILENAME,
} from '../lib/constants';
import type { PmpPayloadInstruction } from '../lib/types';
import { usePmpAccountPayload } from '../model/use-pmp-account-payload';

/** The card table has three columns, so every row in this section spans all of them. */
const CARD_TABLE_COLUMNS = 3;

/**
 * The Decoded Content section of the PMP card. Owns every payload state.
 * A decode failure degrades to the raw view plus an inline note INSIDE this section (it never throws
 * out to the card's error boundary, which would discard the accounts and config tables), and an oversized
 * payload renders a bounded view plus a download rather than the full document.
 *
 * Raw bytes always go through `RawDataField`, which owns the hex/base64 tabs, the byte count, copy, download,
 * show-more and its own too-large guard. Nothing here reimplements those.
 *
 * `cap` overrides the per-encoding decode budget on BOTH the inline and the account path. Left undefined in the
 * app, so each encoding gets the budget measured for it, and set by tests and stories that need a guard state
 * without a fixture hundreds of kilobytes wide.
 */
export function DataPayloadSection({ content, cap }: { content: PmpPayloadInstruction; cap?: number }) {
    const { config, payload } = content;

    // Decoded for every payload, not just `Direct`: `Url` and `External` also get the Decoded/Raw tabs, where the
    // decoded panel applies the instruction's own encoding/compression hints to the POINTER bytes. That is a local
    // decode, not pointer resolution - nothing is fetched and no account is read. Following the pointer is not
    // done here at all, so a `Url` payload shows the url and stops there.
    const decoded = React.useMemo(
        () => (payload ? decodePmpPayload({ cap, config, data: payload }) : undefined),
        [cap, config, payload],
    );

    return (
        <>
            <BaseTable.Row>
                <BaseTable.Cell colSpan={CARD_TABLE_COLUMNS} data-testid="pmp-payload-section">
                    <PayloadBody cap={cap} content={content} decoded={decoded} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}

function PayloadBody({
    cap,
    content,
    decoded,
}: {
    cap: number | undefined;
    content: PmpPayloadInstruction;
    decoded: PmpPayloadDecodeResult | undefined;
}) {
    const { dataSource } = content;

    // A 4-byte header-only setData updates the hints and leaves the stored bytes alone - not "no data", and not a decode failure.
    // Only `setData` reaches here:
    // `initialize` carries `dataSource` as a fixed struct field, so its decode always produces one.
    if (dataSource === undefined) {
        return (
            <Alert variant="default" data-testid="pmp-header-only-note" className="!mb-0">
                Instruction carries no new payload.
            </Alert>
        );
    }

    if (content.payload === undefined) {
        return <AccountSourceSection cap={cap} content={content} dataSource={dataSource} />;
    }

    // A payload is present, which is exactly what the memo in the parent decodes on, so `decoded` is always set
    // here. TypeScript cannot relate the two, so narrow once and keep `decoded` NON-optional in everything below -
    // the impossible state must not cross a component boundary.
    if (!decoded) return <></>;

    return (
        <DecodedTabs
            compression={content.config.compression}
            content={content}
            dataSource={dataSource}
            decoded={decoded}
            payload={content.payload}
            source="instruction"
        />
    );
}

/**
 * setData from a foreign buffer, or initialize in-place: the bytes are not in this transaction, they are in the
 * account this instruction points at. That account can be read, so the section names it and reads it.
 */
function AccountSourceSection({
    cap,
    content,
    dataSource,
}: {
    cap: number | undefined;
    content: PmpPayloadInstruction;
    dataSource: DataSource;
}) {
    const account = content.kind === 'setData' ? content.sourceBuffer : content.metadataAccount;
    const label = content.kind === 'setData' ? 'Source buffer account' : 'Metadata account';

    if (!account) {
        return (
            <Alert variant="default" data-testid="pmp-deferred-source-note" className="!mb-0">
                This instruction carries no payload bytes.
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-0">
            <Alert variant="default" data-testid="pmp-deferred-source-note" className="!mb-0 pl-0">
                <div className="flex w-full flex-row items-center gap-2">
                    <span>The payload was written to the {label}</span>
                    <Address noNicknameEditing pubkey={new PublicKey(account)} link raw />
                </div>
            </Alert>
            <AccountPayload account={account} cap={cap} content={content} dataSource={dataSource} />
        </div>
    );
}

/**
 * Reads what the referenced account holds RIGHT NOW, on render.
 * Deliberately not a reconstruction of what the viewed transaction wrote, no write-history replay.
 */
function AccountPayload({
    account,
    cap,
    content,
    dataSource,
}: {
    account: string;
    cap: number | undefined;
    content: PmpPayloadInstruction;
    dataSource: DataSource;
}) {
    // `content.config` comes from the card's own `decodePmpContentInstruction` memo, so it is referentially
    // stable across renders, which is what keeps the hook from re-decoding the payload on every render.
    const state = usePmpAccountPayload({ address: account, cap, config: content.config });

    if (state.status === 'loading') {
        return (
            <span data-testid="pmp-account-loading" className="text-xs text-neutral-500">
                Reading account...
            </span>
        );
    }

    if (state.status === 'failed') {
        return (
            <Alert variant="warning" data-testid="pmp-account-failed" className="!mb-0">
                Could not read this account. The RPC request failed.
            </Alert>
        );
    }

    return <AccountContentBody content={content} dataSource={dataSource} result={state.content} />;
}

function AccountContentBody({
    content,
    dataSource,
    result,
}: {
    content: PmpPayloadInstruction;
    dataSource: DataSource;
    result: PmpAccountDecodeResult;
}) {
    if (result.kind === 'absent') {
        return (
            <Alert variant="warning" data-testid="pmp-account-absent" className="!mb-0">
                Account does not exist on chain.
            </Alert>
        );
    }

    // Not a warning: the account exists and is well formed, it simply has no payload yet.
    if (result.kind === 'empty') {
        return (
            <Alert variant="default" data-testid="pmp-account-empty" className="!mb-0">
                The account is allocated but has not been written yet.
            </Alert>
        );
    }

    if (result.kind === 'unreadable') {
        return (
            <Alert variant="warning" data-testid="pmp-account-unreadable" className="!mb-0">
                Could not read account content: {result.reason}.
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-0">
            <DecodedTabs
                compression={result.config.compression}
                content={content}
                dataSource={dataSource}
                decoded={result.payload}
                payload={result.body}
                source="account"
            />
        </div>
    );
}

function DecodedTabs({
    compression,
    content,
    dataSource,
    decoded,
    payload,
    source,
}: {
    compression: Compression;
    content: PmpPayloadInstruction;
    dataSource: DataSource;
    decoded: PmpPayloadDecodeResult;
    payload: Uint8Array;
    source: 'account' | 'instruction';
}) {
    // `onValueChange` fires only on a reader-initiated switch, never for the tab selected on mount, so the
    // default panel produces no event. Radix hands back a plain string, so narrow it to the tracked union.
    const handleTabChange = (value: string) => {
        if (value !== 'decoded' && value !== 'raw') return;
        pmpAnalytics.trackTabOpened({
            dataSource: PMP_DATA_SOURCE_ANALYTICS_NAMES[dataSource],
            format: PMP_FORMAT_ANALYTICS_NAMES[content.config.format],
            instruction: PMP_ANALYTICS_IX_NAMES[content.kind],
            source,
            tab: value,
        });
    };

    return (
        <Tabs defaultValue="raw" onValueChange={handleTabChange}>
            <TabsList>
                <TabsTrigger value="raw">Raw</TabsTrigger>
                <TabsTrigger value="decoded">Decoded</TabsTrigger>
            </TabsList>
            <TabsContent value="raw" className="pt-3">
                <RawBytes compression={compression} payload={payload} source={source} />
            </TabsContent>
            <TabsContent value="decoded" className="pt-3">
                <DecodedBody compression={compression} decoded={decoded} stored={payload.length} />
            </TabsContent>
        </Tabs>
    );
}

function DecodedBody({
    compression,
    decoded,
    stored,
}: {
    compression: Compression;
    decoded: PmpPayloadDecodeResult;
    stored: number;
}) {
    if (decoded.kind === 'failed') {
        return (
            <div className="flex flex-col gap-0">
                <Alert variant="warning" data-testid="pmp-decode-error" className="!mb-0">
                    Could not decode this payload: {decoded.reason}
                </Alert>
            </div>
        );
    }

    // Abandoned mid-unpack, so there are no decompressed bytes to offer and no download to promise. The sibling
    // Raw tab still has the payload as stored, which is the only thing that exists for this state.
    if (decoded.kind === 'unpack-overflow') {
        return (
            <div className="flex flex-col gap-0 whitespace-pre-wrap" data-testid="pmp-payload-unpack-overflow">
                <Alert variant="warning" className="!mb-0">
                    Payload expands past the {decoded.limit}-byte limit for unpacking.
                </Alert>
            </div>
        );
    }

    if (decoded.kind === 'oversized') {
        return (
            <div className="flex flex-col gap-3" data-testid="pmp-payload-oversized">
                <Alert variant="warning" className="!mb-0 whitespace-pre-wrap">
                    Payload too large to render ({describeSize(decoded.bytes.length, stored, compression)}, limit{' '}
                    {decoded.budget}).
                </Alert>
                <RawDataField
                    data={decoded.bytes}
                    extraButton={<BytesBadge compression={compression} side="uncompressed" />}
                    filename={PMP_DECODED_DOWNLOAD_FILENAME}
                />
            </div>
        );
    }

    if (decoded.kind === 'empty') {
        return (
            <Alert variant="default" data-testid="pmp-payload-empty" className="!mb-0">
                The payload is empty.
            </Alert>
        );
    }

    // Plain text rather than a JSON viewer: the common payload is a program IDL, and react-json-view is not
    // virtualized, so an interactive tree costs thousands of nodes per card. A Json payload arrives already
    // pretty-printed from `toDocumentText`, so every format renders through this one node.
    // TODO: follow a `DataSource.Url` or `DataSource.External` pointer. Today its bytes render as text, unresolved.
    return (
        <div className="relative">
            <div className="absolute right-2 top-2 z-10" data-testid="pmp-decoded-copy">
                <Copyable text={decoded.text} />
            </div>
            <pre
                data-testid="pmp-decoded-text"
                className="mb-0 max-h-80 overflow-auto whitespace-pre-wrap bg-heavy-metal-900 p-3 pr-8 text-left text-xs [overflow-wrap:anywhere]"
            >
                {decoded.text}
            </pre>
        </div>
    );
}

/**
 * Names WHICH bytes a count refers to, because the two tabs measure two different things:
 * the Decoded panel counts the UNPACKED payload.
 * the Raw tab counts the payload as stored.
 */
function describeSize(unpacked: number, stored: number, compression: Compression): string {
    if (compression === Compression.None) return `${unpacked} bytes`;
    return `${unpacked} bytes unpacked from ${stored} stored`;
}

function BytesBadge({ compression, side }: { compression: Compression; side: 'compressed' | 'uncompressed' }) {
    if (compression === Compression.None) return undefined;

    const isCompressed = side === 'compressed';
    return (
        <Badge data-testid={`pmp-bytes-badge-${side}`} variant={isCompressed ? 'warning' : 'info'}>
            {isCompressed ? PMP_COMPRESSED_BYTES_LABELS[compression] : PMP_UNCOMPRESSED_BYTES_LABEL}
        </Badge>
    );
}

function RawBytes({
    compression,
    payload,
    source,
}: {
    compression: Compression;
    payload: Uint8Array;
    source: 'account' | 'instruction';
}) {
    const isAccount = source === 'account';
    return (
        <div data-testid={isAccount ? 'pmp-account-raw' : 'pmp-payload-raw'}>
            <RawDataField
                data={payload}
                extraButton={<BytesBadge compression={compression} side="compressed" />}
                filename={isAccount ? PMP_ACCOUNT_RAW_DOWNLOAD_FILENAME : PMP_RAW_DOWNLOAD_FILENAME}
            />
        </div>
    );
}
