import { gen } from '@__fixtures__/gen';
import { PMP_ADDRESS } from '@entities/pmp-account';
import { getBase58Decoder } from '@solana/kit';
import type { Connection } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getInitializeInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { describe, expect, it, vi } from 'vitest';

import { findConfigInTransactions, PMP_LOOKUP_MAX_SIGNATURES } from '../find-config-in-transactions';

const BASE58_DECODER = getBase58Decoder();

// Generated rather than borrowed from the devnet fixtures. Every assertion here turns on WHICH INDEX an account
// occupies, never on the account itself, so a real address would imply a dependency the scan does not have - and it
// would break if the fixtures were ever re-minted.
const BUFFER = gen.address(1);
const AUTHORITY = gen.address(2);
const METADATA = gen.address(3);
/** A second, unrelated buffer - the "some other account" in every negative case. */
const OTHER = gen.address(4);

const SET_DATA = new Uint8Array(
    getSetDataInstructionDataEncoder().encode({
        compression: Compression.Gzip,
        dataSource: DataSource.Direct,
        encoding: Encoding.Utf8,
        format: Format.Json,
    }),
);

/** A `write` targeting the same buffer at the same index 2. Declares no config, so it must never match. */
const WRITE = new Uint8Array([0, 0, 0, 0, 0, 1, 2, 3]);

/**
 * A `getTransaction` response is only ever read through `message.getAccountKeys()`,
 * `message.compiledInstructions` and `meta`, so a fake carrying those three is enough and avoids building a real
 * VersionedMessage. `getAccountKeys` is a function so the ALT-aware call signature is exercised.
 */
function transaction({
    keys = [METADATA, AUTHORITY, BUFFER, PMP_ADDRESS],
    data = SET_DATA,
    inner = false,
    err = null,
}: { keys?: string[]; data?: Uint8Array; inner?: boolean; err?: unknown } = {}) {
    const programIdIndex = keys.indexOf(PMP_ADDRESS);
    const compiled = { accountKeyIndexes: [0, 1, 2], data, programIdIndex };

    return {
        meta: {
            err,
            innerInstructions: inner
                ? [
                      {
                          index: 0,
                          instructions: [{ accounts: [0, 1, 2], data: BASE58_DECODER.decode(data), programIdIndex }],
                      },
                  ]
                : [],
            loadedAddresses: undefined,
        },
        transaction: {
            message: {
                compiledInstructions: inner ? [] : [compiled],
                getAccountKeys: () => ({ get: (index: number) => ({ toBase58: () => keys[index] }) }),
            },
        },
    };
}

function connectionWith(
    signatures: { signature: string; err?: unknown }[],
    transactions: Record<string, unknown> = {},
) {
    const getSignaturesForAddress = vi
        .fn()
        .mockResolvedValue(signatures.map(entry => ({ err: entry.err ?? null, signature: entry.signature })));
    const getTransaction = vi.fn().mockImplementation((signature: string) => transactions[signature] ?? null);

    return {
        connection: { getSignaturesForAddress, getTransaction } as unknown as Connection,
        getSignaturesForAddress,
        getTransaction,
    };
}

/** `write` with a `sourceBuffer`: no inline data, so the bytes come from the account at index 2. */
function writeBytes(offset = 0) {
    const data = new Uint8Array(5);
    new DataView(data.buffer).setUint32(1, offset, true);
    return data;
}

const INITIALIZE = new Uint8Array(
    getInitializeInstructionDataEncoder().encode({
        compression: Compression.Gzip,
        dataSource: DataSource.Direct,
        encoding: Encoding.Utf8,
        format: Format.Yaml,
        seed: 'yaml-gzip',
    }),
);

/**
 * The canonical build: `write` the payload across from a source buffer, then `initialize` the PDA. Mirrors the
 * real devnet twin transactions - the source buffer sits at index 2 of the write, and the config is declared for
 * the PDA at index 0 of the initialize.
 */
/** One `write` in the fixture. Named accounts rather than key indexes, so a case reads as what it models. */
type WriteIx = { target?: string; source?: string; offset?: number };

function copyTransaction({ writeIxs = [{}] }: { writeIxs?: WriteIx[] } = {}) {
    const keys = [METADATA, AUTHORITY, BUFFER, PMP_ADDRESS, OTHER];
    const programIdIndex = keys.indexOf(PMP_ADDRESS);
    const at = (address: string) => keys.indexOf(address);
    const ix = (data: Uint8Array, accounts: string[]) => ({
        accountKeyIndexes: accounts.map(at),
        data,
        programIdIndex,
    });

    return {
        meta: { err: null, innerInstructions: [], loadedAddresses: undefined },
        transaction: {
            message: {
                compiledInstructions: [
                    // `write` accounts are [Buffer, Authority, SourceBuffer] - the target is index 0, not index 2.
                    ...writeIxs.map(({ target = METADATA, source = BUFFER, offset = 0 }) =>
                        ix(writeBytes(offset), [target, AUTHORITY, source]),
                    ),
                    ix(INITIALIZE, [METADATA, AUTHORITY]),
                ],
                getAccountKeys: () => ({ get: (index: number) => ({ toBase58: () => keys[index] }) }),
            },
        },
    };
}

describe('findConfigInTransactions', () => {
    it('should read the declared config from the newest consuming setData', async () => {
        const { connection } = connectionWith([{ signature: 'newest' }], { newest: transaction() });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            dataSource: DataSource.Direct,
            kind: 'found-for-buffer-acc',
            signature: 'newest',
        });
    });

    it('should stop at the first match rather than walking the whole history', async () => {
        const { connection, getTransaction } = connectionWith([{ signature: 'a' }, { signature: 'b' }], {
            a: transaction(),
            b: transaction(),
        });

        await findConfigInTransactions(connection, BUFFER);

        expect(getTransaction).toHaveBeenCalledTimes(1);
    });

    it('should skip a signature whose transaction failed', async () => {
        const { connection, getTransaction } = connectionWith(
            [{ err: { InstructionError: [0, 'Custom'] }, signature: 'failed' }, { signature: 'good' }],
            { good: transaction() },
        );

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toMatchObject({ signature: 'good' });
        expect(getTransaction).toHaveBeenCalledTimes(1);
    });

    it('should find a setData issued by CPI through innerInstructions', async () => {
        const { connection } = connectionWith([{ signature: 'cpi' }], { cpi: transaction({ inner: true }) });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toMatchObject({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Json },
            kind: 'found-for-buffer-acc',
        });
    });

    // The buffer sitting at some other index means this setData consumed a DIFFERENT buffer.
    it('should not attribute another account config to this buffer', async () => {
        const { connection } = connectionWith([{ signature: 'other' }], {
            other: transaction({ keys: [METADATA, AUTHORITY, AUTHORITY, PMP_ADDRESS] }),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should not treat a write of this buffer as a declared config', async () => {
        const { connection } = connectionWith([{ signature: 'write' }], { write: transaction({ data: WRITE }) });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    // A pending buffer is an ok state, not a failure.
    it('should report not-found when nothing consumed the buffer', async () => {
        const { connection } = connectionWith([{ signature: 'none' }], {});

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should report max-signatures-limit distinctly when the signature cap is filled', async () => {
        const signatures = Array.from({ length: PMP_LOOKUP_MAX_SIGNATURES }, (_, index) => ({
            signature: `s${index}`,
        }));
        const { connection } = connectionWith(signatures);

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'max-signatures-limit' });
    });

    it('should cap how many signatures it requests', async () => {
        const { connection, getSignaturesForAddress } = connectionWith([]);

        await findConfigInTransactions(connection, BUFFER);

        expect(getSignaturesForAddress).toHaveBeenCalledWith(expect.anything(), {
            limit: PMP_LOOKUP_MAX_SIGNATURES,
        });
    });

    it('should recover a config declared for the metadata account this buffer was copied into', async () => {
        const { connection } = connectionWith([{ signature: 'copy' }], { copy: copyTransaction() });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({
            config: { compression: Compression.Gzip, encoding: Encoding.Utf8, format: Format.Yaml },
            dataSource: DataSource.Direct,
            kind: 'found-for-metadata-acc',
            metadata: METADATA,
            signature: 'copy',
        });
    });

    // A buffer placed at a non-zero offset supplied only PART of the document, so the PDA's config describes an
    // assembly this buffer is a fragment of - applying it here would try to inflate the middle of a stream.
    it('should refuse a copy that did not start at offset 0', async () => {
        const { connection } = connectionWith([{ signature: 'partial' }], {
            partial: copyTransaction({ writeIxs: [{ offset: 900 }] }),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should refuse a copy when another buffer also wrote to the same metadata account', async () => {
        const { connection } = connectionWith([{ signature: 'shared' }], {
            shared: copyTransaction({ writeIxs: [{}, { offset: 900, source: OTHER }] }),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    // The case above is two sources feeding ONE destination. This is the opposite: one source feeding TWO, which
    // is what `copies.length !== 1` guards. Nothing says which destination's config describes this buffer, so no
    // inference is safe - even though both copies carry its bytes whole.
    it('should refuse a copy when this buffer was copied into two destinations', async () => {
        const { connection } = connectionWith([{ signature: 'twice' }], {
            twice: copyTransaction({ writeIxs: [{}, { target: OTHER }] }),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should ignore a copy that names a different source buffer', async () => {
        const { connection } = connectionWith([{ signature: 'other' }], {
            other: copyTransaction({ writeIxs: [{ source: OTHER }] }),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({ kind: 'not-found' });
    });

    it('should prefer a directly declared config over a copied one', async () => {
        const { connection } = connectionWith([{ signature: 'direct' }, { signature: 'copy' }], {
            copy: copyTransaction(),
            direct: transaction(),
        });

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toMatchObject({
            kind: 'found-for-buffer-acc',
            signature: 'direct',
        });
    });

    it('should report a failed RPC call as a typed result rather than throwing', async () => {
        const connection = {
            getSignaturesForAddress: vi.fn().mockRejectedValue(new Error('429 Too Many Requests')),
        } as unknown as Connection;

        await expect(findConfigInTransactions(connection, BUFFER)).resolves.toEqual({
            kind: 'failed',
            reason: '429 Too Many Requests',
        });
    });
});
