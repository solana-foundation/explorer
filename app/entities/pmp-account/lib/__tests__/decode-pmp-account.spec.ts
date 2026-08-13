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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { concat } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { PMP_ADDRESS } from '../constants';
import { decodePmpAccount } from '../decode-pmp-account';
import type { PmpDecodeConfig } from '../types';

const PROGRAM = gen.address(1) as Address;
const AUTHORITY = gen.address(2) as Address;

const DOC = '{"name":"company","version":"1.0.0"}';
/** The same document as `DOC`, indented - a `Format.Json` payload is re-serialised before it reaches the card. */
const DOC_PRETTY = '{\n  "name": "company",\n  "version": "1.0.0"\n}';

/** The instruction's hints. A Buffer account is decoded with these, a Metadata account with its own. */
const IX_CONFIG: PmpDecodeConfig = { compression: Compression.None, encoding: Encoding.Utf8, format: Format.Json };

/** The library's own producer, so every body below is a byte-exact round trip of what the client puts on chain. */
function pack(content: string, compression: Compression): Uint8Array {
    return packDirectData({ compression, content, encoding: Encoding.Utf8 }).data as Uint8Array;
}

/** Both encoders inject their own discriminator, so these fixtures carry the real 96-byte header. */
function bufferAccount(body: Uint8Array): Uint8Array {
    return getBufferEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        data: body,
        program: PROGRAM,
        seed: 'idl',
    }) as Uint8Array;
}

function metadataAccount({
    body,
    config = IX_CONFIG,
    dataLength,
}: {
    body: Uint8Array;
    config?: PmpDecodeConfig;
    dataLength?: number;
}): Uint8Array {
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression: config.compression,
        data: body,
        dataLength: dataLength ?? body.length,
        dataSource: DataSource.Direct,
        encoding: config.encoding,
        format: config.format,
        mutable: true,
        program: PROGRAM,
        seed: 'idl',
    }) as Uint8Array;
}

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
        const result = read(bufferAccount(pack(DOC, Compression.None)));

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
            account: { data: bufferAccount(pack(DOC, Compression.None)), lamports: 1, owner: PMP_ADDRESS },
        });

        expect(result).toEqual({ kind: 'unreadable', reason: expect.stringContaining('no decode config') });
    });

    it('should decompress a Buffer account body when the instruction says it is compressed', () => {
        const result = decodePmpAccount({
            account: { data: bufferAccount(pack(DOC, Compression.Zlib)), lamports: 1, owner: PMP_ADDRESS },
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
        });

        expect(result.kind === 'payload' && result.payload).toMatchObject({ kind: 'decoded', text: DOC_PRETTY });
    });

    it('should decode a Metadata account with the account hints rather than the instruction hints', () => {
        // The account is Zlib, the instruction claims None. Decoding with the instruction's hints would hand raw
        // deflate bytes to the UTF-8 step, so a correct document proves the account's own header won.
        const accountConfig = { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json };
        const result = read(metadataAccount({ body: pack(DOC, Compression.Zlib), config: accountConfig }));

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
        const result = read(metadataAccount({ body: concat([body, new Uint8Array(512)]), dataLength: body.length }));

        expect(result.kind === 'payload' && result.body).toEqual(body);
        expect(result.kind === 'payload' && result.payload).toMatchObject({ kind: 'decoded', text: DOC_PRETTY });
    });

    it('should report absent for the closed-account shape the provider hands back', () => {
        expect(read(new Uint8Array(0), { lamports: 0 })).toEqual({ kind: 'absent' });
        expect(read(undefined, { lamports: 0 })).toEqual({ kind: 'absent' });
    });

    it('should report unreadable when the account is not owned by the Program Metadata Program', () => {
        const result = read(bufferAccount(pack(DOC, Compression.None)), { owner: PROGRAM });

        expect(result).toEqual({ kind: 'unreadable', reason: expect.stringContaining(PROGRAM) });
    });

    it('should report unreadable when the account is shorter than the header', () => {
        expect(read(new Uint8Array(95))).toEqual({ kind: 'unreadable', reason: expect.stringContaining('96-byte') });
    });

    it('should not call a live account short when it was fetched without its data', () => {
        // The provider caches by address across three fetch modes, and a `skip` fetch stores an account with no
        // bytes. That is an absent FETCH, not an absent or short ACCOUNT, so it must not claim a length.
        const result = read(undefined, { lamports: 2_000_000 });

        expect(result).toEqual({ kind: 'unreadable', reason: expect.stringContaining('without its data') });
        expect(result.kind === 'unreadable' && result.reason).not.toContain('96-byte');
    });

    it('should report an Empty discriminator as empty rather than demote it to a failure', () => {
        const empty = bufferAccount(pack(DOC, Compression.None));
        empty[0] = 0; // AccountDiscriminator.Empty

        expect(read(empty)).toEqual({ kind: 'empty' });
    });

    it('should report unreadable when a Metadata header carries an out-of-range hint', () => {
        const account = metadataAccount({ body: pack(DOC, Compression.None) });
        account[83] = 9; // the `encoding` byte, past every variant the enum defines

        expect(read(account)).toEqual({ kind: 'unreadable', reason: expect.any(String) });
    });

    it('should surface a body that does not decode as a payload failure, not an unreadable account', () => {
        // The account itself parses fine - it is the CONTENT that is not the zlib stream the hints promise. That
        // distinction is what the UI renders differently, so it must survive here.
        const result = decodePmpAccount({
            account: { data: bufferAccount(new Uint8Array([1, 2, 3, 4])), lamports: 1, owner: PMP_ADDRESS },
            config: { compression: Compression.Zlib, encoding: Encoding.Utf8, format: Format.Json },
        });

        expect(result).toMatchObject({ kind: 'payload', payload: { kind: 'failed' } });
    });

    it('should not report an Empty discriminator, which is an ordinary allocated-but-unwritten account', () => {
        const empty = bufferAccount(pack(DOC, Compression.None));
        empty[0] = 0; // AccountDiscriminator.Empty

        read(empty);

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report a discriminator outside the enum to Sentry, since it means an unknown account layout', () => {
        const unknown = bufferAccount(pack(DOC, Compression.None));
        unknown[0] = 9; // past every variant AccountDiscriminator defines

        expect(read(unknown)).toEqual({ kind: 'unreadable', reason: expect.stringContaining('discriminator 9') });
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown PMP account discriminator'),
            expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining({ discriminator: 9 }) }),
        );
    });

    it('should report a decoder throw to Sentry with the original error as the cause', () => {
        const account = metadataAccount({ body: pack(DOC, Compression.None) });
        account[83] = 9; // the `encoding` byte, past every variant the enum defines

        read(account);

        // Only the PMP program writes these headers and it validates its own enums, so an out-of-range hint means
        // the layout this slice decodes has drifted from the program's - that is ours, so it goes to Sentry.
        expect(Logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ cause: expect.any(Error) }),
            expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining({ discriminator: 2 }) }),
        );
    });

    it('should report a header-only Buffer account as an empty payload, not a blank document', () => {
        // `allocate` leaves exactly this: 96 bytes of header, discriminator Buffer, no body yet. It clears the
        // short-account guard, and the remainder decoder hands back zero bytes.
        const account = bufferAccount(new Uint8Array(0));

        expect(account).toHaveLength(96);
        expect(read(account)).toMatchObject({ kind: 'payload', payload: { kind: 'empty' } });
    });

    it('should report a Metadata account whose dataLength is zero as an empty payload', () => {
        const result = read(metadataAccount({ body: new Uint8Array(0) }));

        expect(result).toMatchObject({ account: 'metadata', kind: 'payload', payload: { kind: 'empty' } });
    });

    it('should log nothing when an account decodes', () => {
        read(bufferAccount(pack(DOC, Compression.None)));

        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report the payload oversized above the render cap without decoding it', () => {
        const body = pack('a'.repeat(4096), Compression.None);
        const result = decodePmpAccount({
            account: { data: bufferAccount(body), lamports: 1, owner: PMP_ADDRESS },
            cap: 1024,
            config: { compression: Compression.None, encoding: Encoding.Utf8, format: Format.None },
        });

        expect(result).toMatchObject({ kind: 'payload', payload: { kind: 'oversized' } });
    });
});
