import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { createSolanaRpc } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { afterEach, describe, expect, it, vi } from 'vitest';

import codamaPmp from '../../mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';

const mocks = vi.hoisted(() => ({ resolveProgramIdls: vi.fn() }));

vi.mock('../resolve-program-idls', () => ({ resolveProgramIdls: mocks.resolveProgramIdls }));

import { resolveProgramIdlNames } from '../resolve-program-idl-names';

const PROGRAM = gen.address(7);

// `initialDelay: 0` keeps the retry cases on real timers, so nothing here needs the fake-timer flush.
// `maxRetries: 1` is what the OG image will actually pass.
const BACKOFF = { initialDelay: 0, maxRetries: 1 };

// The overlapping pair from `instruction-name-table.spec.ts`: the program-metadata IDL claims u8 `1` at
// offset 0, and this Anchor IDL's 8-byte discriminator starts with that same byte, so both tables name
// the same instruction data and precedence is visible in the returned name.
const OVERLAPPING_DATA = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);

const anchorIdl = {
    instructions: [{ accounts: [], args: [], discriminator: [...OVERLAPPING_DATA], name: 'anchor_initialize' }],
    metadata: { name: 'anchor_overlap', spec: '0.1.0', version: '0.1.0' },
};

// A retryable failure is matched by structured `code`, not by message - see RETRYABLE_FETCH_ERROR_CODES.
const transientError = () => Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });

/** What `resolveProgramIdls` returns. Only the two IDL fields are read here, so the addresses stay absent. */
function resolved(programMetadataIdl?: unknown, anchorIdl?: unknown) {
    return { anchorIdl, anchorIdlAddress: undefined, programMetadataIdl, programMetadataIdlAddress: undefined };
}

describe('resolveProgramIdlNames', () => {
    afterEach(() => vi.clearAllMocks());

    it('should skip a non-anchor program without fetching', async () => {
        await expect(resolveProgramIdlNames(DEFAULT_RPC_URL, SYSTEM_PROGRAM_ADDRESS, BACKOFF)).resolves.toBeUndefined();

        expect(mocks.resolveProgramIdls).not.toHaveBeenCalled();
    });

    it('should prefer the program-metadata name over Anchor for the program and for an instruction', async () => {
        mocks.resolveProgramIdls.mockResolvedValue(resolved(codamaPmp, anchorIdl));

        const names = await resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF);

        expect(names?.programName).toBe('Program Metadata');
        // Source order, not longest prefix: the 1-byte program-metadata match beats Anchor's 8-byte one.
        expect(names?.resolveInstructionName?.(OVERLAPPING_DATA)).toBe('Initialize');
    });

    it('should fall through to the Anchor IDL when program-metadata is absent', async () => {
        mocks.resolveProgramIdls.mockResolvedValue(resolved(undefined, anchorIdl));

        const names = await resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF);

        expect(names?.programName).toBe('Anchor Overlap');
        expect(names?.resolveInstructionName?.(OVERLAPPING_DATA)).toBe('Anchor Initialize');
    });

    it('should build its RPC client from the url it was given', async () => {
        mocks.resolveProgramIdls.mockResolvedValue(resolved(codamaPmp));

        await resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF);

        expect(vi.mocked(createSolanaRpc)).toHaveBeenCalledWith(DEFAULT_RPC_URL);
    });

    it('should return undefined when the program has no IDL at all', async () => {
        mocks.resolveProgramIdls.mockResolvedValue(resolved(undefined, undefined));

        await expect(resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF)).resolves.toBeUndefined();
    });

    it('should return undefined for an IDL carrying neither a metadata name nor a usable table', async () => {
        mocks.resolveProgramIdls.mockResolvedValue(resolved({ instructions: [], metadata: { spec: '0.1.0' } }));

        await expect(resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF)).resolves.toBeUndefined();
    });

    it('should retry a transient RPC failure with a fresh client and resolve on the second attempt', async () => {
        mocks.resolveProgramIdls.mockRejectedValueOnce(transientError()).mockResolvedValue(resolved(codamaPmp));

        const names = await resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF);

        expect(names?.programName).toBe('Program Metadata');
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(2);
        expect(vi.mocked(createSolanaRpc)).toHaveBeenCalledTimes(2);
    });

    it('should not retry a fatal failure, and should propagate it', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(new Error('invalid program address'));

        await expect(resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, BACKOFF)).rejects.toThrow(
            'invalid program address',
        );
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(1);
    });

    it('should not retry when maxRetries is zero', async () => {
        mocks.resolveProgramIdls.mockRejectedValue(transientError());

        await expect(
            resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, { initialDelay: 0, maxRetries: 0 }),
        ).rejects.toThrow('socket hang up');
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(1);
    });

    it('should not touch the RPC when the deadline has already expired', async () => {
        await expect(
            resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, { ...BACKOFF, abortSignal: AbortSignal.abort() }),
        ).rejects.toHaveProperty('name', 'AbortError');
        expect(mocks.resolveProgramIdls).not.toHaveBeenCalled();
    });

    it('should stop retrying once the deadline expires', async () => {
        const deadline = new AbortController();
        mocks.resolveProgramIdls.mockImplementation(() => {
            deadline.abort();
            return Promise.reject(transientError());
        });

        await expect(
            resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, { ...BACKOFF, abortSignal: deadline.signal }),
        ).rejects.toHaveProperty('name', 'AbortError');
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(1);
    });

    it('should let the caller override the retry classifier', async () => {
        mocks.resolveProgramIdls
            .mockRejectedValueOnce(new Error('fatal by default'))
            .mockResolvedValue(resolved(codamaPmp));

        const names = await resolveProgramIdlNames(DEFAULT_RPC_URL, PROGRAM, { ...BACKOFF, shouldRetry: () => true });

        expect(names?.programName).toBe('Program Metadata');
        expect(mocks.resolveProgramIdls).toHaveBeenCalledTimes(2);
    });
});
