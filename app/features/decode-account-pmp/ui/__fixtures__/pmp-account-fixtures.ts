import { gen } from '@__fixtures__/gen';
import { type PmpAccountReadResult, readPmpAccount } from '@entities/pmp-account';
import type { Address } from '@solana/kit';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
    packDirectData,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';

/**
 * Account-byte builders shared by the PMP card specs and story files.
 *
 * Every fixture is built with the LIBRARY's own encoders and `packDirectData`, so each one is a byte-exact round trip
 * of what the client puts on chain rather than a hand-assembled header that could drift from the real layout.
 *
 * Lives in `__fixtures__` rather than `__stories__` because both `__tests__` and `__stories__` consume it, and a spec
 * reaching into a stories folder for its builders reads as a dependency that is not really there.
 */
export const TARGET_PROGRAM = gen.address(1) as Address;
export const AUTHORITY = gen.address(2) as Address;

export const YAML_DOC = 'name: orbit\nversion: 1.0.0\n';

export const IDL_DOC = JSON.stringify({
    instructions: [{ name: 'initialize' }],
    name: 'company_program',
    version: '1.0.0',
});

export function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

/** Header values as observed on chain: Utf8 / Zlib / Json / Direct, with the real seeds. */
export function metadataAccountData(body: Uint8Array, seed = 'idl'): Uint8Array {
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression: Compression.Zlib,
        data: body,
        dataLength: body.length,
        dataSource: DataSource.Direct,
        encoding: Encoding.Utf8,
        format: Format.Json,
        mutable: true,
        program: TARGET_PROGRAM,
        seed,
    }) as Uint8Array;
}

/**
 * A Metadata account declaring `Base64` over a BINARY payload, which is what the devnet twin of the binary fixture
 * holds. `decodeData` renders those bytes as one unbroken base64 string - 512 stored bytes become 684 characters with
 * no space or newline anywhere in them, which is the shape that used to widen the whole card.
 */
export function metadataBase64AccountData(body: Uint8Array): Uint8Array {
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression: Compression.Gzip,
        data: body,
        dataLength: body.length,
        dataSource: DataSource.Direct,
        encoding: Encoding.Base64,
        format: Format.None,
        mutable: true,
        program: TARGET_PROGRAM,
        seed: 'binary-blob',
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

/**
 * Reads account bytes the way the card's stateful half does, then asserts which kind came out.
 *
 * The assertion is the point: it types the `header` prop without a cast at each call site, and a fixture whose bytes
 * stop producing the expected kind fails loudly here instead of quietly rendering the wrong card.
 */
export function readAs<TKind extends PmpAccountReadResult['kind']>(
    raw: Uint8Array,
    kind: TKind,
): Extract<PmpAccountReadResult, { kind: TKind }> {
    const result = readPmpAccount({
        account: { data: raw, lamports: 2_000_000, owner: PROGRAM_METADATA_PROGRAM_ADDRESS },
    });

    if (result.kind !== kind) {
        throw new Error(`fixture decoded as "${result.kind}", expected "${kind}"`);
    }

    return result as Extract<PmpAccountReadResult, { kind: TKind }>;
}
