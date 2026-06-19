import { type Address, SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdlVariant } from '../../model/idl-variant';
import { resolveProgramIdls } from '../resolve-program-idls';

const mocks = vi.hoisted(() => ({
    fetchAnchorIdl: vi.fn(),
    fetchPmpIdl: vi.fn(),
}));

// Mock only the RPC-backed fetchers; keep the real `unwrapIdl` so the spec exercises the actual
// parse + JSON-object validation the orchestrator layers its Anchor shape guard on top of.
vi.mock('@solana/idl', async () => {
    const actual = await vi.importActual<typeof import('@solana/idl')>('@solana/idl');
    return { ...actual, fetchAnchorIdl: mocks.fetchAnchorIdl, fetchPmpIdl: mocks.fetchPmpIdl };
});

const SEED = 'idl';
const PROGRAM = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj' as Address;
const SYSTEM_PROGRAM = '11111111111111111111111111111111' as Address; // in NON_ANCHOR_PROGRAMS
const ANCHOR_ACCOUNT = 'BPFLoaderUpgradeab1e11111111111111111111111';
const PMP_ACCOUNT = 'Stake11111111111111111111111111111111111111';

const both = { includeAnchor: true, includePmp: true, seed: SEED };

// Minimal RPC stub: `getSignaturesForAddress(addr)` yields the configured slot (newest-first, limit 1).
function rpc(slots: Record<string, bigint> = {}) {
    return {
        getSignaturesForAddress: (account: string) => ({
            send: async () => (slots[account] !== undefined ? [{ slot: slots[account] }] : []),
        }),
    } as never;
}

const anchorOk = (content: object, address = ANCHOR_ACCOUNT) =>
    ({ address, content: JSON.stringify(content), source: 'anchor', status: 'ok' }) as never;
const pmpOk = (content: object, address = PMP_ACCOUNT) =>
    ({ address, authority: null, content: JSON.stringify(content), source: 'pmp', status: 'ok' }) as never;
const absent = (address: string) => ({ address, status: 'absent' }) as never;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('resolveProgramIdls', () => {
    it('should map both sources and prefer the more recently written tab', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ instructions: [], name: 'anchor' }));
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'pmp' }));

        const result = await resolveProgramIdls(rpc({ [ANCHOR_ACCOUNT]: 200n, [PMP_ACCOUNT]: 100n }), PROGRAM, both);

        expect(result.anchorIdl).toEqual({ instructions: [], name: 'anchor' });
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
        expect(result.rejections).toEqual([]);
    });

    it('should prefer PMP on a recency tie', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ instructions: [] }));
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'p' }));

        const { preferredVariant } = await resolveProgramIdls(
            rpc({ [ANCHOR_ACCOUNT]: 100n, [PMP_ACCOUNT]: 100n }),
            PROGRAM,
            both,
        );
        expect(preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should prefer Anchor when both resolve but only the Anchor write-slot is known', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ instructions: [] }));
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'p' }));

        // PMP account has no signatures → its slot is unknown.
        const { preferredVariant } = await resolveProgramIdls(rpc({ [ANCHOR_ACCOUNT]: 123n }), PROGRAM, both);
        expect(preferredVariant).toBe(IdlVariant.Anchor);
    });

    it('should reject an Anchor account whose JSON is not IDL-shaped (no top-level instructions[])', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ hello: 'world' }));
        mocks.fetchPmpIdl.mockResolvedValueOnce(absent(PMP_ACCOUNT));

        const { anchorIdl, preferredVariant } = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(anchorIdl).toBeUndefined();
        expect(preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should treat absent / corrupt sources as undefined', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: ANCHOR_ACCOUNT,
            reason: 'payload',
            source: 'anchor',
            status: 'corrupt',
        } as never);
        mocks.fetchPmpIdl.mockResolvedValueOnce(absent(PMP_ACCOUNT));

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toBeUndefined();
        expect(result.rejections).toEqual([]);
    });

    it('should skip the Anchor lookup for native/builtin programs but still resolve PMP', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'native' }));

        const result = await resolveProgramIdls(rpc(), SYSTEM_PROGRAM, both);
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'native' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should not fetch the Anchor source when includeAnchor is false', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'p' }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, { includeAnchor: false, includePmp: true, seed: SEED });
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
        expect(result.programMetadataIdl).toEqual({ name: 'p' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should not fetch the PMP source when includePmp is false (and prefer Anchor)', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ instructions: [] }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, { includeAnchor: true, includePmp: false });
        expect(mocks.fetchPmpIdl).not.toHaveBeenCalled();
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
    });

    it('should request the PMP IDL with fndn fallback authorities (authority omitted)', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(absent(PMP_ACCOUNT));

        await resolveProgramIdls(rpc(), PROGRAM, { includeAnchor: false, includePmp: true, seed: SEED });
        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith(expect.anything(), PROGRAM, { seed: SEED });
    });

    it('should serve the source that resolved and surface the rejection when the other RPC-errors', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'pmp' }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
        expect(result.rejections).toEqual([rpcError]);
    });

    it('should throw when nothing resolved and a source errored (no cached false-negative)', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);
        mocks.fetchPmpIdl.mockResolvedValueOnce(absent(PMP_ACCOUNT));

        await expect(resolveProgramIdls(rpc(), PROGRAM, both)).rejects.toBe(rpcError);
    });

    it('should run no recency lookups for a single resolved source', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'p' }));
        const getSignaturesForAddress = vi.fn(() => ({ send: async () => [] }));

        await resolveProgramIdls({ getSignaturesForAddress } as never, PROGRAM, {
            includeAnchor: false,
            includePmp: true,
            seed: SEED,
        });
        expect(getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should degrade preferred-tab to PMP when both resolve but the recency lookup throws', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(anchorOk({ instructions: [] }));
        mocks.fetchPmpIdl.mockResolvedValueOnce(pmpOk({ name: 'p' }));
        const throwingRpc = {
            getSignaturesForAddress: () => ({
                send: async () => {
                    throw new Error('rpc down');
                },
            }),
        } as never;

        const { preferredVariant } = await resolveProgramIdls(throwingRpc, PROGRAM, both);
        expect(preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });
});
