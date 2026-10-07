import { Compression, Encoding, Format } from '@solana-program/program-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { concat } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import {
    bufferAccountData,
    DOC,
    DOC_PRETTY,
    metadataAccountData,
    pack,
    TARGET_PROGRAM,
} from '../../__fixtures__/pmp-account';
import { PMP_ADDRESS } from '../constants';
import { decodePmpAccount } from '../decode-pmp-account';
import { readPmpAccount } from '../read-pmp-account';
import type { PmpDecodeConfig } from '../types';

/** The instruction's hints. A Buffer account is decoded with these, a Metadata account with its own. */
const IX_CONFIG: PmpDecodeConfig = { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json };

function read(data: Uint8Array | undefined, overrides: { lamports?: number; owner?: string } = {}) {
    return decodePmpAccount({
        account: { data, lamports: overrides.lamports ?? 1_000_000, owner: overrides.owner ?? PMP_ADDRESS },
        config: IX_CONFIG,
    });
}

describe('decodePmpAccount', () => {
    // The Logger is a global no-op mock (test-setup.specs.ts), so these read the calls the decode makes.
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should decode a Buffer account body with the instruction hints', () => {
        const result = read(bufferAccountData(pack(DOC, Compression.None)));

        expect(result).toEqual({
            account: 'buffer',
            body: expect.any(Uint8Array),
            config: IX_CONFIG,
            kind: 'payload',
            payload: expect.objectContaining({ kind: 'decoded', text: DOC_PRETTY }),
        });
    });

    it('should report a Buffer account unreadable when no decode config is supplied', () => {
        // A Buffer header stores no encoding/compression/format, so without an instruction to take them from there
        // is nothing to decode it with. Recovering them is PR 2's job, not a silent guess here.
        const result = decodePmpAccount({
            account: { data: bufferAccountData(pack(DOC, Compression.None)), lamports: 1, owner: PMP_ADDRESS },
        });

        expect(result).toEqual({ kind: 'unreadable', reason: expect.stringContaining('no decode config') });
    });

    it('should decompress a Buffer account body when the instruction says it is compressed', () => {
        const result = decodePmpAccount({
            account: { data: bufferAccountData(pack(DOC, Compression.Zlib)), lamports: 1, owner: PMP_ADDRESS },
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
        });

        expect(result.kind === 'payload' && result.payload).toMatchObject({ kind: 'decoded', text: DOC_PRETTY });
    });

    it('should decode a Metadata account with the account hints rather than the instruction hints', () => {
        // The account is Zlib, the instruction claims None. Decoding with the instruction's hints would hand raw
        // deflate bytes to the UTF-8 step, so a correct document proves the account's own header won.
        const accountConfig = { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json };
        const result = read(metadataAccountData(pack(DOC, Compression.Zlib), { config: accountConfig }));

        expect(result).toMatchObject({
            account: 'metadata',
            config: accountConfig,
            kind: 'payload',
            payload: { kind: 'decoded', text: DOC_PRETTY },
        });
    });

    it('should ignore the slack an untrimmed extend leaves past dataLength', () => {
        const body = pack(DOC, Compression.None);
        // `data` is a remainder field, so an account grown by `extend` and never trimmed hands back the padding
        // too. Only `dataLength` bytes are the payload.
        const result = read(
            metadataAccountData(concat([body, new Uint8Array(512)]), { config: IX_CONFIG, dataLength: body.length }),
        );

        expect(result.kind === 'payload' && result.body).toEqual(body);
        expect(result.kind === 'payload' && result.payload).toMatchObject({ kind: 'decoded', text: DOC_PRETTY });
    });

    it.each([
        ['absent', new Uint8Array(0), { lamports: 0 }],
        ['absent', undefined, { lamports: 0 }],
        ['unreadable', bufferAccountData(pack(DOC, Compression.None)), { owner: TARGET_PROGRAM }],
        ['unreadable', new Uint8Array(95), {}],
        ['unreadable', undefined, { lamports: 2_000_000 }],
        // AccountDiscriminator.Empty
        ['empty', withByte(bufferAccountData(pack(DOC, Compression.None)), 0, 0), {}],
        // A discriminator past every variant AccountDiscriminator defines
        ['unreadable', withByte(bufferAccountData(pack(DOC, Compression.None)), 0, 9), {}],
        // The `encoding` byte, past every variant the enum defines
        ['unreadable', withByte(metadataAccountData(pack(DOC, Compression.None)), 83, 9), {}],
    ])('should pass the %s result of readPmpAccount through unchanged', (kind, data, overrides) => {
        const account = { data, lamports: 1_000_000, owner: PMP_ADDRESS, ...overrides };

        const result = decodePmpAccount({ account, config: IX_CONFIG });

        expect(result).toMatchObject({ kind });
        expect(result).toEqual(readPmpAccount({ account }));
    });

    it('should surface a body that does not decode as a payload failure, not an unreadable account', () => {
        // The account itself parses fine - it is the CONTENT that is not the zlib stream the hints promise. That
        // distinction is what the UI renders differently, so it must survive here.
        const result = decodePmpAccount({
            account: { data: bufferAccountData(new Uint8Array([1, 2, 3, 4])), lamports: 1, owner: PMP_ADDRESS },
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
        });

        expect(result).toMatchObject({ kind: 'payload', payload: { kind: 'failed' } });
    });

    it('should report a header-only Buffer account as an empty payload, not a blank document', () => {
        // `allocate` leaves exactly this: 96 bytes of header, discriminator Buffer, no body yet. It clears the
        // short-account guard, and the remainder decoder hands back zero bytes.
        const account = bufferAccountData(new Uint8Array(0));

        expect(account).toHaveLength(96);
        expect(read(account)).toMatchObject({ kind: 'payload', payload: { kind: 'empty' } });
    });

    it('should report a Metadata account whose dataLength is zero as an empty payload', () => {
        const result = read(metadataAccountData(new Uint8Array(0)));

        expect(result).toMatchObject({ account: 'metadata', kind: 'payload', payload: { kind: 'empty' } });
    });

    it('should log nothing when an account decodes', () => {
        read(bufferAccountData(pack(DOC, Compression.None)));

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report the payload oversized above the render cap without decoding it', () => {
        const body = pack('a'.repeat(4096), Compression.None);
        const result = decodePmpAccount({
            account: { data: bufferAccountData(body), lamports: 1, owner: PMP_ADDRESS },
            cap: 1024,
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.None },
        });

        expect(result).toMatchObject({ kind: 'payload', payload: { kind: 'oversized' } });
    });
});

function withByte(data: Uint8Array, offset: number, value: number): Uint8Array {
    const copy = data.slice();
    copy[offset] = value;
    return copy;
}
