import { gen } from '@__fixtures__/gen';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getAllocateInstructionDataEncoder,
    getInitializeInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
    getWriteInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { describe, expect, it } from 'vitest';

import { PMP_ADDRESS } from '../constants';
import { decodePmpContentInstruction } from '../decode-pmp-instruction';
import { isProgramMetadataInstruction } from '../is-program-metadata-instruction';

const PMP = new PublicKey(PMP_ADDRESS);
const FOREIGN_BUFFER = gen.publicKey(1);
const METADATA_PDA = gen.publicKey(2);
// `Uint8Array.from` is load-bearing, not redundant: under jsdom `TextEncoder` returns a Uint8Array built with a
// DIFFERENT realm's constructor, and Vitest's `toEqual` compares prototypes, so a bare `encode()` result never
// deep-equals a same-realm Uint8Array ("Compared values have no visual difference"). Re-wrap to this realm.
const DOC_BYTES = Uint8Array.from(new TextEncoder().encode('{"name":"company"}'));

function makeIx(data: Uint8Array, accounts: PublicKey[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: accounts.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: PMP,
    });
}

describe('isProgramMetadataInstruction', () => {
    it('should accept an instruction targeting the PMP program', () => {
        expect(isProgramMetadataInstruction(makeIx(new Uint8Array([3, 1, 0, 1])))).toBe(true);
    });

    it('should reject an instruction targeting another program', () => {
        const ix = new TransactionInstruction({
            data: Buffer.from([0]),
            keys: [],
            programId: PublicKey.default,
        });

        expect(isProgramMetadataInstruction(ix)).toBe(false);
    });
});

describe('decodePmpContentInstruction', () => {
    it('should decode a setData carrying an inline Direct payload', () => {
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.Zlib,
            data: DOC_BYTES,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA, PMP, PMP]));

        expect(result).toEqual({
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
            payload: DOC_BYTES,
        });
    });

    it('should decode a 4-byte header-only setData without a dataSource and without throwing', () => {
        // The generated decoder throws on this shape ("Codec [u8] cannot decode empty byte arrays") and the
        // generated ENCODER cannot build it, so it has to be a literal. It is on-chain valid: the Rust CLI emits
        // it to change `format` without touching the stored bytes.
        const result = decodePmpContentInstruction(makeIx(new Uint8Array([3, 1, 0, 1]), [METADATA_PDA, PMP, PMP]));

        expect(result).toEqual({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'setData',
        });
    });

    it('should reject a header-only setData whose hint byte is out of range instead of casting it', () => {
        // The header-only shape is the only path that reads hint bytes raw, so `PmpDecodeConfigStruct` is what
        // stops an out-of-range byte reaching the card as a number no label map can resolve. `format = 7` here.
        expect(
            decodePmpContentInstruction(makeIx(new Uint8Array([3, 1, 0, 7]), [METADATA_PDA, PMP, PMP])),
        ).toBeUndefined();
    });

    it('should reject a header-only setData whose encoding and compression bytes are out of range', () => {
        expect(decodePmpContentInstruction(makeIx(new Uint8Array([3, 9, 0, 1])))).toBeUndefined();
        expect(decodePmpContentInstruction(makeIx(new Uint8Array([3, 1, 9, 1])))).toBeUndefined();
    });

    it('should accept every in-range hint combination on the header-only shape', () => {
        // Guards against the struct being too strict - e.g. listing the enum variants wrongly, or `Object.values`
        // on a numeric enum admitting its reverse-mapping label strings.
        for (const encoding of [0, 1, 2, 3]) {
            for (const compression of [0, 1, 2]) {
                for (const format of [0, 1, 2, 3]) {
                    const result = decodePmpContentInstruction(
                        makeIx(new Uint8Array([3, encoding, compression, format])),
                    );
                    expect(result).toEqual({ config: { compression, encoding, format }, kind: 'setData' });
                }
            }
        }
    });

    it('should report the foreign buffer when setData carries no inline payload', () => {
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA, PMP, FOREIGN_BUFFER]));

        expect(result).toEqual({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
            sourceBuffer: FOREIGN_BUFFER.toBase58(),
        });
    });

    it('should not report a source buffer when account index 2 holds the program id', () => {
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA, PMP, PMP]));

        expect(result).toEqual({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'setData',
        });
    });

    it('should decode an initialize carrying an inline payload with its seed', () => {
        const data = getInitializeInstructionDataEncoder().encode({
            compression: Compression.None,
            data: DOC_BYTES,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
            seed: 'idl',
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA]));

        expect(result).toEqual({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'initialize',
            metadataAccount: METADATA_PDA.toBase58(),
            payload: DOC_BYTES,
            seed: 'idl',
        });
    });

    it('should report the metadata account when initialize is the in-place shape', () => {
        const data = getInitializeInstructionDataEncoder().encode({
            compression: Compression.None,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
            seed: 'idl',
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA]));

        expect(result).toEqual({
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'initialize',
            metadataAccount: METADATA_PDA.toBase58(),
            seed: 'idl',
        });
    });

    it('should decode a write carrying an inline chunk at its logical offset', () => {
        const data = getWriteInstructionDataEncoder().encode({
            data: new Uint8Array([1, 2, 3]),
            offset: 7,
        }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA, PMP, PMP]));

        expect(result).toEqual({ chunk: new Uint8Array([1, 2, 3]), kind: 'write', offset: 7 });
    });

    it('should report the source buffer for a write whose chunk is not in the transaction', () => {
        const data = getWriteInstructionDataEncoder().encode({ offset: 7 }) as Uint8Array;

        const result = decodePmpContentInstruction(makeIx(data, [METADATA_PDA, PMP, FOREIGN_BUFFER]));

        expect(result).toEqual({ kind: 'write', offset: 7, sourceBuffer: FOREIGN_BUFFER.toBase58() });
    });

    it('should return undefined for a housekeeping instruction so the caller falls through to the IDL tier', () => {
        const data = getAllocateInstructionDataEncoder().encode({ seed: 'idl' }) as Uint8Array;

        expect(decodePmpContentInstruction(makeIx(data, [METADATA_PDA]))).toBeUndefined();
    });

    it('should return undefined for an unrecognised discriminator instead of throwing', () => {
        expect(decodePmpContentInstruction(makeIx(new Uint8Array([99])))).toBeUndefined();
    });

    it('should return undefined for empty instruction data instead of throwing', () => {
        expect(decodePmpContentInstruction(makeIx(new Uint8Array([])))).toBeUndefined();
    });

    it('should return undefined for a truncated setData instead of throwing', () => {
        // Discriminator 3 with only one hint byte: identify succeeds, the typed decoder then fails.
        expect(decodePmpContentInstruction(makeIx(new Uint8Array([3, 1])))).toBeUndefined();
    });

    it('should return undefined for a setData whose enum byte is out of range', () => {
        const valid = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            data: DOC_BYTES,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;
        const corrupt = Uint8Array.from(valid);
        corrupt[3] = 7; // the `format` byte

        expect(decodePmpContentInstruction(makeIx(corrupt, [METADATA_PDA, PMP, PMP]))).toBeUndefined();
    });
});
