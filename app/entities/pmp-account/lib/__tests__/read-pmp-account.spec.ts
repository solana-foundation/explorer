import { gen } from '@__fixtures__/gen';
import { type Address, some, unwrapOption } from '@solana/kit';
import {
    AccountDiscriminator,
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
} from '@solana-program/program-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { PMP_ADDRESS } from '../constants';
import { readPmpAccount } from '../read-pmp-account';

const PROGRAM = gen.address(1) as Address;
const AUTHORITY = gen.address(2) as Address;
/** All-zero address. Both option fields use `noneValue: 'zeroes'`, so this is how "unset" is written on chain. */
const ZERO_ADDRESS = '11111111111111111111111111111111' as Address;

const BODY = new Uint8Array([1, 2, 3, 4]);

function bufferAccount({
    canonical = true,
    program = PROGRAM,
    seed = 'idl',
}: { canonical?: boolean; program?: Address; seed?: string } = {}): Uint8Array {
    return getBufferEncoder().encode({
        authority: AUTHORITY,
        canonical,
        data: BODY,
        program,
        seed,
    }) as Uint8Array;
}

function metadataAccount({ dataLength }: { dataLength?: number } = {}): Uint8Array {
    return getMetadataEncoder().encode({
        authority: AUTHORITY,
        canonical: true,
        compression: Compression.Zlib,
        data: BODY,
        dataLength: dataLength ?? BODY.length,
        dataSource: DataSource.Direct,
        encoding: Encoding.Utf8,
        format: Format.Json,
        mutable: true,
        program: PROGRAM,
        seed: 'security',
    }) as Uint8Array;
}

function read(data: Uint8Array | undefined, overrides: { lamports?: number; owner?: string } = {}) {
    return readPmpAccount({
        account: { data, lamports: overrides.lamports ?? 1_000_000, owner: overrides.owner ?? PMP_ADDRESS },
    });
}

describe('readPmpAccount', () => {
    // The Logger is a global no-op mock (test-setup.specs.ts), so these read the calls the read makes.
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should read a Metadata header including its decode hints', () => {
        // The generated struct verbatim: `authority` stays a wrapped Option and `data` stays the remainder, so
        // this pins the shape the card reads rather than a hand-mapped copy of it.
        expect(read(metadataAccount())).toEqual({
            account: {
                authority: some(AUTHORITY),
                canonical: true,
                compression: Compression.Zlib,
                data: BODY,
                dataLength: BODY.length,
                dataSource: DataSource.Direct,
                discriminator: AccountDiscriminator.Metadata,
                encoding: Encoding.Utf8,
                format: Format.Json,
                mutable: true,
                program: PROGRAM,
                seed: 'security',
            },
            kind: 'metadata',
        });
    });

    it('should report a Metadata account whose dataLength exceeds its stored body, i.e. a truncated account', () => {
        const header = read(metadataAccount({ dataLength: BODY.length + 128 }));

        expect(header.kind === 'metadata' && header.account.dataLength).toBe(BODY.length + 128);
        expect(header.kind === 'metadata' && header.account.data.length).toBe(BODY.length);
    });

    it('should read a PDA Buffer header', () => {
        expect(read(bufferAccount())).toEqual({
            account: {
                authority: some(AUTHORITY),
                canonical: true,
                data: BODY,
                discriminator: AccountDiscriminator.Buffer,
                program: some(PROGRAM),
                seed: 'idl',
            },
            kind: 'buffer',
        });
    });

    it('should report no program and no seed for a keypair Buffer, which leaves both zeroed', () => {
        // `allocate` writes program/canonical/seed only for a PDA buffer, so the option decoder reports none and
        // the card hides those rows rather than showing the reader fields the account does not have.
        const header = read(bufferAccount({ canonical: false, program: ZERO_ADDRESS, seed: '' }));

        expect(header.kind === 'buffer' && unwrapOption(header.account.program)).toBeNull();
        expect(header.kind === 'buffer' && header.account.seed).toBe('');
    });

    it('should read a seed that nearly fills the 16-byte field', () => {
        // `orbit-registry` is 14 of the 16 bytes, the longest seed observed on chain. The decoder is
        // `fixDecoderSize(getUtf8Decoder(), 16)`, which strips NUL padding, so a near-full seed has to survive
        // intact - the short seeds the other cases use would not catch a truncation at the field boundary.
        const header = read(bufferAccount({ seed: 'orbit-registry' }));

        expect(header.kind === 'buffer' && header.account.seed).toBe('orbit-registry');
    });

    it('should report an Empty account as its own kind rather than as unreadable', () => {
        const empty = bufferAccount();
        empty[0] = 0; // AccountDiscriminator.Empty

        expect(read(empty)).toEqual({ kind: 'empty' });
        expect(Logger.warn).not.toHaveBeenCalled();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    it('should report absent for the closed-account shape the provider hands back', () => {
        expect(read(new Uint8Array(0), { lamports: 0 })).toEqual({ kind: 'absent' });
        expect(read(undefined, { lamports: 0 })).toEqual({ kind: 'absent' });
    });

    it('should report unreadable when the account is not owned by the Program Metadata Program', () => {
        expect(read(metadataAccount(), { owner: PROGRAM })).toEqual({
            kind: 'unreadable',
            reason: expect.stringContaining(PROGRAM),
        });
    });

    it('should report unreadable when the account is shorter than the header', () => {
        expect(read(new Uint8Array(95))).toEqual({ kind: 'unreadable', reason: expect.stringContaining('96-byte') });
    });

    it('should not call a live account short when it was fetched without its data', () => {
        const header = read(undefined, { lamports: 2_000_000 });

        expect(header).toEqual({ kind: 'unreadable', reason: expect.stringContaining('without its data') });
    });

    it('should report a discriminator outside the enum to Sentry, since it means an unknown account layout', () => {
        const unknown = metadataAccount();
        unknown[0] = 9;

        expect(read(unknown)).toEqual({ kind: 'unreadable', reason: expect.stringContaining('discriminator 9') });
        expect(Logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('unknown PMP account discriminator'),
            expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining({ discriminator: 9 }) }),
        );
    });

    it('should report a decoder throw to Sentry with the original error as the cause', () => {
        const account = metadataAccount();
        account[83] = 9; // the `encoding` byte, past every variant the enum defines

        expect(read(account)).toEqual({ kind: 'unreadable', reason: expect.any(String) });
        expect(Logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ cause: expect.any(Error) }),
            expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining({ discriminator: 2 }) }),
        );
    });
});
