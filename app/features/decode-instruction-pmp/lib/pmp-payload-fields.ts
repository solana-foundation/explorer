import {
    address,
    documentText,
    type InstructionFieldList,
    note,
    payload,
    type PayloadContentBlock,
    rawData,
    string,
    text,
} from '@entities/instruction-card';
import {
    decodePmpPayload,
    getPayloadDataHash,
    PMP_COMPRESSED_BYTES_LABELS,
    PMP_POINTER_HASH_NOTES,
    PMP_UNCOMPRESSED_BYTES_LABEL,
    type PmpPayloadDecodeResult,
} from '@entities/pmp-account';
import type { Address } from '@solana/kit';
import { Compression, DataSource } from '@solana-program/program-metadata';

import type { PmpTab } from './analytics';
import {
    PMP_DECODED_DOWNLOAD_FILENAME,
    PMP_RAW_DOWNLOAD_FILENAME,
    PMP_WRITE_CHUNK_DOWNLOAD_FILENAME,
} from './constants';
import { createPayloadTabTracker } from './payload-tab-tracker';
import type { PmpAccountPayloadResult, PmpBytesSource, PmpPayloadInstruction } from './types';

export const NO_PAYLOAD_FIELDS: InstructionFieldList = [note('This instruction carries no payload bytes.')];

/** `write` is a fragment with no hints, so it can never be decoded to a document on its own. */
export function writeFields(chunk: PmpBytesSource): InstructionFieldList {
    switch (chunk.kind) {
        case 'inline':
            // A chunk runs to ~1 KB, so it gets the same field the raw payload does, not a bare hex grid.
            return [rawData({ data: chunk.bytes, filename: PMP_WRITE_CHUNK_DOWNLOAD_FILENAME, label: 'chunk' })];
        case 'account':
            return [note('The chunk was copied from the SourceBuffer account, so it is not in this instruction.')];
        case 'absent':
            return NO_PAYLOAD_FIELDS;
    }
}

export function inlinePayloadFields({
    pmpIx,
    bytes,
    dataSource,
}: {
    pmpIx: PmpPayloadInstruction;
    bytes: Uint8Array;
    dataSource: DataSource;
}): InstructionFieldList {
    const decoded = decodePmpPayload({ config: pmpIx.config, data: bytes });
    return [
        ...hashFields(decoded, dataSource),
        payloadField({
            compression: pmpIx.config.compression,
            decoded,
            onTabChange: createPayloadTabTracker({ dataSource, pmpIx, source: 'instruction' }),
            stored: bytes,
        }),
    ];
}

/** A failed read or an unusable account shows as a note, so it never hides the account and argument rows. */
export function accountPayloadFields({
    pmpIx,
    account,
    dataSource,
    state,
}: {
    pmpIx: PmpPayloadInstruction;
    account: Address;
    dataSource: DataSource;
    state: PmpAccountPayloadResult;
}): InstructionFieldList {
    const accountField = address(pmpIx.kind === 'setData' ? 'Source buffer account' : 'Metadata account', account);

    if (state.status === 'loading') return [accountField, note('Reading account...')];
    if (state.status === 'failed') {
        return [accountField, note('Could not read this account. The RPC request failed.', 'warning')];
    }

    const { result } = state;
    switch (result.kind) {
        case 'absent':
            return [accountField, note('Account does not exist on chain.', 'warning')];
        // Not a warning: the account exists and is well formed, it simply has no payload yet.
        case 'empty':
            return [accountField, note('The account is allocated but has not been written yet.')];
        case 'unreadable':
            return [accountField, note(`Could not read account content: ${result.reason}.`, 'warning')];
        case 'payload':
            return [
                ...hashFields(result.payload, dataSource),
                accountField,
                payloadField({
                    compression: result.config.compression,
                    decoded: result.payload,
                    onTabChange: createPayloadTabTracker({ dataSource, pmpIx, source: 'account' }),
                    stored: result.body,
                }),
            ];
    }
}

/** A non-Direct payload stores a pointer, so the row says why there is no hash rather than digest the reference. */
function hashFields(decoded: PmpPayloadDecodeResult, dataSource: DataSource): InstructionFieldList {
    const hash = getPayloadDataHash(decoded);
    if (hash === undefined) return [];
    return [
        dataSource === DataSource.Direct
            ? string('Data Hash', hash)
            : text('Data Hash', PMP_POINTER_HASH_NOTES[dataSource]),
    ];
}

function payloadField({
    compression,
    decoded,
    onTabChange,
    stored,
}: {
    compression: Compression;
    decoded: PmpPayloadDecodeResult;
    onTabChange: (tab: PmpTab) => void;
    stored: Uint8Array;
}) {
    return payload({
        decoded: decodedBlocks(decoded, compression, stored.length),
        onTabChange,
        raw: rawData({
            badge: bytesBadge(compression, 'compressed'),
            data: stored,
            filename: PMP_RAW_DOWNLOAD_FILENAME,
        }),
    });
}

function decodedBlocks(
    decoded: PmpPayloadDecodeResult,
    compression: Compression,
    stored: number,
): PayloadContentBlock[] {
    switch (decoded.kind) {
        case 'failed':
            return [note(`Could not decode this payload: ${decoded.reason}`, 'warning')];
        // Abandoned mid-unpack, so there are no decompressed bytes to offer and no download to promise. The sibling
        // Raw tab still has the payload as stored, which is the only thing that exists for this state.
        case 'unpack-overflow':
            return [note(`Payload expands past the ${decoded.limit}-byte limit for unpacking.`, 'warning')];
        case 'oversized':
            return [
                note(
                    `Payload too large to render (${describeSize(decoded.bytes.length, stored, compression)}, limit ${decoded.budget}).`,
                    'warning',
                ),
                rawData({
                    badge: bytesBadge(compression, 'uncompressed'),
                    data: decoded.bytes,
                    filename: PMP_DECODED_DOWNLOAD_FILENAME,
                }),
            ];
        case 'empty':
            return [note('The payload is empty.')];
        // Plain text rather than a JSON viewer: the common payload is a program IDL, and react-json-view is not
        // virtualized, so an interactive tree costs thousands of nodes per card. A Json payload arrives already
        // pretty-printed from `toDocumentText`, so every format renders through this one block.
        // TODO: follow a `DataSource.Url` or `DataSource.External` pointer. Today its bytes render as text, unresolved.
        case 'decoded':
            return [documentText(decoded.text)];
    }
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

function bytesBadge(
    compression: Compression,
    side: 'compressed' | 'uncompressed',
): { text: string; tone: 'info' | 'warning' } | undefined {
    if (compression === Compression.None) return undefined;
    return side === 'compressed'
        ? { text: PMP_COMPRESSED_BYTES_LABELS[compression], tone: 'warning' }
        : { text: PMP_UNCOMPRESSED_BYTES_LABEL, tone: 'info' };
}
