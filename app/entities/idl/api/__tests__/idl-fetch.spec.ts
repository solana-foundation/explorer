import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { lastWriteSlot, resolveAnchorIdl, resolvePmpIdl } from '../idl-fetch';

const mocks = vi.hoisted(() => ({
    fetchAnchorIdl: vi.fn(),
    fetchPmpIdl: vi.fn(),
}));

vi.mock('@solana/idl', () => ({
    fetchAnchorIdl: mocks.fetchAnchorIdl,
    fetchPmpIdl: mocks.fetchPmpIdl,
}));

const PROGRAM = 'C7QLEmDz81Usvy2sYa4xZSdA8EwEcYvZo8iuYZMaqXmj' as any;
const CANONICAL = 'BPFLoaderUpgradeab1e11111111111111111111111' as any;
const FALLBACK = 'fndnu15PLXELbLsTqrfbiweBvsBj2o12RoVfkeCCbX2' as any;

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
});

describe('resolveAnchorIdl', () => {
    it('should return the parsed IDL and account address on valid content', async () => {
        const idl = { instructions: [], metadata: { name: 'x' } };
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: CANONICAL,
            content: JSON.stringify(idl),
            source: 'anchor',
            status: 'ok',
        });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toEqual({ address: CANONICAL, idl });
    });

    it('should return undefined when there is no Anchor IDL account (absent)', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({ address: CANONICAL, status: 'absent' });
        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).not.toHaveBeenCalled();
    });

    it('should return undefined (and warn) when the account bytes are corrupt', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: CANONICAL,
            reason: 'payload',
            source: 'anchor',
            status: 'corrupt',
        });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return undefined (and warn) when the content is not valid JSON', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: CANONICAL,
            content: 'not-json{',
            source: 'anchor',
            status: 'ok',
        });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return undefined (and warn) when content is valid JSON but not IDL-shaped', async () => {
        // Well-formed JSON object at the IDL PDA, but missing the top-level `instructions` array.
        // The shape guard rejects it so we don't serve/cache garbage as a valid Anchor IDL.
        mocks.fetchAnchorIdl.mockResolvedValueOnce({
            address: CANONICAL,
            content: JSON.stringify({ hello: 'world' }),
            source: 'anchor',
            status: 'ok',
        });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should re-throw RPC errors so the caller can classify them', async () => {
        // `fetchAnchorIdl` throws only on RPC failure; that error must propagate unswallowed.
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).rejects.toBe(rpcError);
        expect(Logger.warn).not.toHaveBeenCalled();
    });
});

describe('resolvePmpIdl', () => {
    it('should map an ok canonical result to the resolved shape', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({
            address: CANONICAL,
            authority: null,
            content: 'canonical-content',
            source: 'pmp',
            status: 'ok',
        });

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toEqual({
            address: CANONICAL,
            authority: null,
            content: 'canonical-content',
        });
    });

    it('should carry the matched fallback authority through', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({
            address: FALLBACK,
            authority: FALLBACK,
            content: 'fallback-content',
            source: 'pmp',
            status: 'ok',
        });

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toEqual({
            address: FALLBACK,
            authority: FALLBACK,
            content: 'fallback-content',
        });
    });

    it('should return undefined when no metadata is published (absent)', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({ address: CANONICAL, status: 'absent' });
        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toBeUndefined();
    });

    it('should return undefined when the metadata account is present but corrupt', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({
            address: CANONICAL,
            authority: null,
            reason: 'payload',
            source: 'pmp',
            status: 'corrupt',
        });
        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toBeUndefined();
    });

    it('should re-throw RPC errors instead of swallowing them', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchPmpIdl.mockRejectedValueOnce(rpcError);

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).rejects.toBe(rpcError);
    });

    it('should request canonical-only lookups (null authority) when fallbacks are disabled', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({ address: CANONICAL, status: 'absent' });

        await resolvePmpIdl({} as any, PROGRAM, 'security', false);

        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith({}, PROGRAM, { authority: null, seed: 'security' });
    });

    it('should request fallback authorities (undefined authority) when enabled', async () => {
        mocks.fetchPmpIdl.mockResolvedValueOnce({ address: CANONICAL, status: 'absent' });

        await resolvePmpIdl({} as any, PROGRAM, 'idl', true);

        expect(mocks.fetchPmpIdl).toHaveBeenCalledWith({}, PROGRAM, { authority: undefined, seed: 'idl' });
    });
});

describe('lastWriteSlot', () => {
    function rpcReturning(value: unknown) {
        return { getSignaturesForAddress: () => ({ send: async () => value }) } as any;
    }

    it('should return the most recent signature slot', async () => {
        await expect(lastWriteSlot(rpcReturning([{ slot: 42n }]), CANONICAL)).resolves.toBe(42n);
    });

    it('should return undefined when there are no signatures', async () => {
        await expect(lastWriteSlot(rpcReturning([]), CANONICAL)).resolves.toBeUndefined();
    });

    it('should return undefined when the lookup throws', async () => {
        const rpc = {
            getSignaturesForAddress: () => ({
                send: async () => {
                    throw new Error('rpc down');
                },
            }),
        } as any;
        await expect(lastWriteSlot(rpc, CANONICAL)).resolves.toBeUndefined();
    });
});
