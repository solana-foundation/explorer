import { type Address, SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IdlVariant } from '../../model/idl-variant';
import { resolveProgramIdls } from '../resolve-program-idls';

const mocks = vi.hoisted(() => ({
    fetchAnchorIdl: vi.fn(),
    fetchLatestIdls: vi.fn(),
    fetchPmpIdl: vi.fn(),
}));

// Mock the RPC-backed fetchers; keep the real `parseIdl` so the spec exercises the actual parse +
// JSON-object validation the resolver layers its Anchor `instructions[]` guard on top of.
vi.mock('@solana/idl', async () => {
    const actual = await vi.importActual<typeof import('@solana/idl')>('@solana/idl');
    return {
        ...actual,
        fetchAnchorIdl: mocks.fetchAnchorIdl,
        fetchLatestIdls: mocks.fetchLatestIdls,
        fetchPmpIdl: mocks.fetchPmpIdl,
    };
});

const PROGRAM = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj' as Address;
const SYSTEM_PROGRAM = '11111111111111111111111111111111' as Address; // in NON_ANCHOR_PROGRAMS

const both = { includePmp: true };

// fetchLatestIdls returns each source as an empty or single-element array of { content }.
const latest = (anchor?: object, pmp?: object) =>
    ({
        anchor: anchor ? [{ content: JSON.stringify(anchor) }] : [],
        pmp: pmp ? [{ content: JSON.stringify(pmp) }] : [],
    }) as never;
const ok = (content: object) => ({ content: JSON.stringify(content), status: 'ok' }) as never;
const absent = { status: 'absent' } as never;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('resolveProgramIdls', () => {
    it('should resolve both sources via fetchLatestIdls and prefer PMP when both are present', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest({ instructions: [], name: 'anchor' }, { name: 'pmp' }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);

        expect(mocks.fetchLatestIdls).toHaveBeenCalledWith(expect.anything(), PROGRAM);
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
        expect(mocks.fetchPmpIdl).not.toHaveBeenCalled();
        expect(result.anchorIdl).toEqual({ instructions: [], name: 'anchor' });
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should prefer Anchor when it is the only source present', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest({ instructions: [] }, undefined));

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(result.anchorIdl).toEqual({ instructions: [] });
        expect(result.programMetadataIdl).toBeUndefined();
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
    });

    it('should not validate IDL shape — any JSON object passes for both sources (detection is client-side)', async () => {
        // No `instructions[]` guard: PMP can be Codama (instructions nested under `program`), so the
        // resolver asserts only "is a JSON object" for both sources; the UI detects the format.
        mocks.fetchLatestIdls.mockResolvedValueOnce(
            latest({ hello: 'world' }, { kind: 'rootNode', standard: 'codama' }),
        );

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(result.anchorIdl).toEqual({ hello: 'world' });
        expect(result.programMetadataIdl).toEqual({ kind: 'rootNode', standard: 'codama' });
    });

    it('should treat both-absent as undefined IDLs', async () => {
        mocks.fetchLatestIdls.mockResolvedValueOnce(latest(undefined, undefined));

        const result = await resolveProgramIdls(rpc(), PROGRAM, both);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toBeUndefined();
    });

    it('should fetch only the Anchor IDL when includePmp is false (inspector / Anchor-only)', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(ok({ instructions: [] }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, { includePmp: false });
        expect(mocks.fetchLatestIdls).not.toHaveBeenCalled();
        expect(mocks.fetchPmpIdl).not.toHaveBeenCalled();
        expect(result.anchorIdl).toEqual({ instructions: [] });
        expect(result.preferredVariant).toBe(IdlVariant.Anchor);
    });

    it('should fetch only the PMP IDL when includeAnchor is false (PMP-only program-name label)', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(ok({ name: 'pmp' }));

        const result = await resolveProgramIdls(rpc(), PROGRAM, { includeAnchor: false, includePmp: true });
        // includeAnchor:false skips the Anchor PDA lookup (and fetchLatestIdls, which would do one).
        expect(mocks.fetchLatestIdls).not.toHaveBeenCalled();
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith(expect.anything(), PROGRAM);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'pmp' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should skip the Anchor leg for native/builtin programs and resolve PMP only', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce(ok({ name: 'native' }));

        const result = await resolveProgramIdls(rpc(), SYSTEM_PROGRAM, both);
        // Native → no Anchor PDA lookup, and no fetchLatestIdls (which would do one).
        expect(mocks.fetchLatestIdls).not.toHaveBeenCalled();
        expect(mocks.fetchAnchorIdl).not.toHaveBeenCalled();
        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith(expect.anything(), SYSTEM_PROGRAM);
        expect(result.anchorIdl).toBeUndefined();
        expect(result.programMetadataIdl).toEqual({ name: 'native' });
        expect(result.preferredVariant).toBe(IdlVariant.ProgramMetadata);
    });

    it('should drop a single source that is absent', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(absent);

        const result = await resolveProgramIdls(rpc(), PROGRAM, { includePmp: false });
        expect(result.anchorIdl).toBeUndefined();
    });

    it('should propagate RPC failures (caller decides 502 vs retry)', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchLatestIdls.mockRejectedValueOnce(rpcError);

        await expect(resolveProgramIdls(rpc(), PROGRAM, both)).rejects.toBe(rpcError);
    });
});

// The resolver never touches the rpc handle itself (it hands it to the mocked fetchers).
function rpc() {
    return {} as never;
}
