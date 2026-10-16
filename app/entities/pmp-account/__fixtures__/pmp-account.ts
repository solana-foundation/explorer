import { gen } from '@__fixtures__/gen';
import type { Address } from '@solana/kit';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
    packDirectData,
} from '@solana-program/program-metadata';

import type { PmpDecodeConfig } from '../lib/types';

/**
 * Account-byte builders shared by the PMP specs and stories.
 *
 * Every fixture is built with the LIBRARY's own encoders and `packDirectData`, so each one is a byte-exact round trip
 * of what the client puts on chain rather than a hand-assembled header that could drift from the real layout.
 */
export const TARGET_PROGRAM = gen.address(1) as Address;
export const AUTHORITY = gen.address(2) as Address;

export const DOC = '{"name":"company","version":"1.0.0"}';
/** The same document as `DOC`, indented - a `Format.Json` payload is re-serialised before it reaches the card. */
export const DOC_PRETTY = '{\n  "name": "company",\n  "version": "1.0.0"\n}';

// `encoding` tells `packDirectData` how to read `content`, so Utf8 is the only choice for a text document.
export function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

/** Header values as observed on chain: Utf8 / Zlib / Json / Direct. */
const ON_CHAIN_CONFIG: PmpDecodeConfig = {
    compression: Compression.Zlib,
    encoding: Encoding.Utf8,
    format: Format.Json,
};

export function metadataAccountData(
    body: Uint8Array,
    header: { config?: PmpDecodeConfig; dataLength?: number; seed?: string } = {},
): Uint8Array {
    const { compression, encoding, format } = header.config ?? ON_CHAIN_CONFIG;
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression,
        data: body,
        dataLength: header.dataLength ?? body.length,
        dataSource: DataSource.Direct,
        encoding,
        format,
        mutable: true,
        program: TARGET_PROGRAM,
        seed: header.seed ?? 'idl',
    }) as Uint8Array;
}

/**
 * `program: null` is the KEYPAIR-buffer case: `allocate` writes program, canonical and seed together or not at all,
 * so a keypair buffer carries none of the three. Tested with `=== undefined` rather than `??`, because `??` would
 * quietly replace an explicit `null` with the PDA default and there would be no way to build that case.
 */
export type BufferHeaderOverrides = { canonical?: boolean; program?: Address | null; seed?: string };

export function bufferAccountData(body: Uint8Array, header: BufferHeaderOverrides = {}): Uint8Array {
    return getBufferEncoder().encode({
        authority: AUTHORITY,
        canonical: header.canonical ?? true,
        data: body,
        program: header.program === undefined ? TARGET_PROGRAM : header.program,
        seed: header.seed ?? 'security',
    }) as Uint8Array;
}
