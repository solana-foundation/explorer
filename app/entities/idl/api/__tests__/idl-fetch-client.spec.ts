import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { IdlVariant } from '../../model/idl-variant';
import { resolveAnchorIdlClient, resolveProgramIdlsClient } from '../idl-fetch-client';

const mocks = vi.hoisted(() => ({
    lastWriteSlot: vi.fn(),
    resolveAnchorIdl: vi.fn(),
    resolvePmpIdl: vi.fn(),
}));

// Mock the shared resolvers so `@solana/idl` (and its node polyfills) never load in the test, and so
// we can exercise this module's orchestration (allSettled, recency, error policy) in isolation.
vi.mock('../idl-fetch', () => ({
    lastWriteSlot: mocks.lastWriteSlot,
    resolveAnchorIdl: mocks.resolveAnchorIdl,
    resolvePmpIdl: mocks.resolvePmpIdl,
}));

const URL = 'http://localhost:8899';
const SEED = 'idl';
// A non-native program (Anchor lookup runs) and a native one (Anchor lookup is skipped).
const PROGRAM = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const ANCHOR_ACCOUNT = 'AnchoR1111111111111111111111111111111111111';
const PMP_ACCOUNT = 'PmP11111111111111111111111111111111111111111';

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
});

describe('resolveProgramIdlsClient', () => {
    it('should map both sources and pick the preferred tab from on-chain write recency', async () => {
        mocks.resolveAnchorIdl.mockResolvedValue({
            address: ANCHOR_ACCOUNT,
            idl: { instructions: [], name: 'anchor' },
        });
        mocks.resolvePmpIdl.mockResolvedValue({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'pmp' }),
        });
        // Anchor written more recently than PMP → Anchor tab wins.
        mocks.lastWriteSlot.mockImplementation((_rpc: unknown, account: string) =>
            Promise.resolve(account === ANCHOR_ACCOUNT ? 200n : 100n),
        );

        const result = await resolveProgramIdlsClient({ includePmp: true, programId: PROGRAM, seed: SEED, url: URL });

        expect(result.anchorIdl).toEqual({ instructions: [], name: 'anchor' });
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
    });

    it('should skip the Anchor lookup for native/builtin programs and prefer PMP', async () => {
        mocks.resolvePmpIdl.mockResolvedValue({
            address: PMP_ACCOUNT,
            authority: null,
            content: JSON.stringify({ name: 'native_pmp' }),
        });
        mocks.lastWriteSlot.mockResolvedValue(undefined);

        const result = await resolveProgramIdlsClient({
            includePmp: true,
            programId: SYSTEM_PROGRAM,
            seed: SEED,
            url: URL,
        });

        expect(mocks.resolveAnchorIdl).not.toHaveBeenCalled();
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'native_pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should serve the source that resolved (and warn) when the other errors', async () => {
        mocks.resolveAnchorIdl.mockResolvedValue({
            address: ANCHOR_ACCOUNT,
            idl: { instructions: [], name: 'anchor' },
        });
        mocks.resolvePmpIdl.mockRejectedValue(new Error('rpc blip'));
        mocks.lastWriteSlot.mockResolvedValue(undefined);

        const result = await resolveProgramIdlsClient({ includePmp: true, programId: PROGRAM, seed: SEED, url: URL });

        expect(result.anchorIdl).toEqual({ instructions: [], name: 'anchor' });
        expect(result.programMetadataIdl).toBeUndefined();
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should re-throw when nothing resolved and a source errored (so SWR retries)', async () => {
        mocks.resolveAnchorIdl.mockRejectedValue(new Error('connection refused'));
        mocks.resolvePmpIdl.mockRejectedValue(new Error('connection refused'));

        await expect(
            resolveProgramIdlsClient({ includePmp: true, programId: PROGRAM, seed: SEED, url: URL }),
        ).rejects.toThrow('connection refused');
    });

    it('should not query PMP when includePmp is false', async () => {
        mocks.resolveAnchorIdl.mockResolvedValue({
            address: ANCHOR_ACCOUNT,
            idl: { instructions: [], name: 'anchor' },
        });
        mocks.lastWriteSlot.mockResolvedValue(undefined);

        const result = await resolveProgramIdlsClient({ includePmp: false, programId: PROGRAM, seed: SEED, url: URL });

        expect(mocks.resolvePmpIdl).not.toHaveBeenCalled();
        expect(result.programMetadataIdl).toBeUndefined();
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
    });
});

describe('resolveAnchorIdlClient', () => {
    it('should resolve the Anchor IDL for a non-native program', async () => {
        mocks.resolveAnchorIdl.mockResolvedValue({
            address: ANCHOR_ACCOUNT,
            idl: { instructions: [], name: 'anchor' },
        });

        const idl = await resolveAnchorIdlClient({ programId: PROGRAM, url: URL });

        expect(idl).toEqual({ instructions: [], name: 'anchor' });
    });

    it('should skip the lookup and return undefined for native/builtin programs', async () => {
        const idl = await resolveAnchorIdlClient({ programId: SYSTEM_PROGRAM, url: URL });

        expect(mocks.resolveAnchorIdl).not.toHaveBeenCalled();
        expect(idl).toBeUndefined();
    });

    it('should re-throw RPC errors (so the caller can decide to swallow them)', async () => {
        mocks.resolveAnchorIdl.mockRejectedValue(new Error('connection refused'));

        await expect(resolveAnchorIdlClient({ programId: PROGRAM, url: URL })).rejects.toThrow('connection refused');
    });
});
