import { type Address, SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveProgramIdls } from '../resolve-program-idls';

const mocks = vi.hoisted(() => ({
    fetchLatestIdls: vi.fn(),
    fetchPmpIdl: vi.fn(),
}));

// Mock the RPC-backed fetchers; keep the real `parseIdl` so the spec exercises the actual parse +
// JSON-object validation the resolver layers on top.
vi.mock('@solana/idl', async () => {
    const actual = await vi.importActual<typeof import('@solana/idl')>('@solana/idl');
    return {
        ...actual,
        fetchLatestIdls: mocks.fetchLatestIdls,
        fetchPmpIdl: mocks.fetchPmpIdl,
    };
});

const PROGRAM = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj' as Address;
const SYSTEM_PROGRAM = '11111111111111111111111111111111' as Address; // in NON_ANCHOR_PROGRAMS

// fetchLatestIdls returns each source as an empty or single-element array of { content }.
const latest = (anchor?: object, pmp?: object) =>
    ({
        anchor: anchor ? [{ content: JSON.stringify(anchor) }] : [],
        pmp: pmp ? [{ content: JSON.stringify(pmp) }] : [],
    }) as never;
const ok = (content: object) => ({ content: JSON.stringify(content), status: 'ok' }) as never;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('resolveProgramIdls', () => {
    it('should resolve both sources via fetchLatestIdls when present', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest({ instructions: [], name: 'anchor' }, { name: 'pmp' }));

        const result = await resolveProgramIdls(rpc(), PROGRAM);

        expect(mocks.fetchLatestIdls).toHaveBeenCalledWith(expect.anything(), PROGRAM);
        expect(mocks.fetchPmpIdl).not.toHaveBeenCalled();
        expect(result.anchorIdl).toEqual({ instructions: [], name: 'anchor' });
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
    });

    it('should resolve only the Anchor source when PMP is absent', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest({ instructions: [] }, undefined));

        const result = await resolveProgramIdls(rpc(), PROGRAM);
        expect(result.anchorIdl).toEqual({ instructions: [] });
        expect(result.programMetadataIdl).toBeUndefined();
    });

    it('should not validate IDL shape — any JSON object passes for both sources (detection is client-side)', async () => {
        // No `instructions[]` guard: PMP can be Codama (instructions nested under `program`), so the
        // resolver asserts only "is a JSON object" for both sources; the UI detects the format.
        mocks.fetchLatestIdls.mockResolvedValueOnce(
            latest({ hello: 'world' }, { kind: 'rootNode', standard: 'codama' }),
        );

        const result = await resolveProgramIdls(rpc(), PROGRAM);
        expect(result.anchorIdl).toEqual({ hello: 'world' });
        expect(result.programMetadataIdl).toEqual({ kind: 'rootNode', standard: 'codama' });
    });

    it('should treat both-absent as undefined IDLs', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest(undefined, undefined));

        const result = await resolveProgramIdls(rpc(), PROGRAM);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toBeUndefined();
    });

    it('should skip the Anchor leg for native/builtin programs and resolve PMP only', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(ok({ name: 'native' }));

        const result = await resolveProgramIdls(rpc(), SYSTEM_PROGRAM);
        // Native → no Anchor PDA lookup, and no fetchLatestIdls (which would do one).
        expect(mocks.fetchLatestIdls).not.toHaveBeenCalled();
        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith(expect.anything(), SYSTEM_PROGRAM);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'native' });
    });

    it('should propagate RPC failures (caller decides 502 vs retry)', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchLatestIdls.mockRejectedValueOnce(rpcError);

        await expect(resolveProgramIdls(rpc(), PROGRAM)).rejects.toBe(rpcError);
    });
});

// The resolver never touches the rpc handle itself (it hands it to the mocked fetchers).
function rpc() {
    return {} as never;
}
