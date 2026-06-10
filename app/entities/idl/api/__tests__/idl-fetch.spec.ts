import {
    SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { classifySolanaError, lastWriteSlot, resolveAnchorIdl, resolvePmpIdl } from '../idl-fetch';

const mocks = vi.hoisted(() => ({
    buildPmpIdlLookups: vi.fn(),
    fetchAnchorIdl: vi.fn(),
    fetchMetadataContent: vi.fn(),
}));

vi.mock('@solana/idl', () => ({
    buildPmpIdlLookups: mocks.buildPmpIdlLookups,
    fetchAnchorIdl: mocks.fetchAnchorIdl,
}));

vi.mock('@solana-program/program-metadata', () => ({
    fetchMetadataContent: mocks.fetchMetadataContent,
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
        mocks.fetchAnchorIdl.mockResolvedValueOnce({ address: CANONICAL, content: JSON.stringify(idl) });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toEqual({ address: CANONICAL, idl });
    });

    it('should return undefined when there is no Anchor IDL account', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce(null);
        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
    });

    it('should return undefined (and warn) when the content is not valid JSON', async () => {
        mocks.fetchAnchorIdl.mockResolvedValueOnce({ address: CANONICAL, content: 'not-json{' });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return undefined (and warn) when content is valid JSON but not IDL-shaped', async () => {
        // Well-formed JSON object at the IDL PDA, but missing the top-level `instructions` array.
        // The shape guard rejects it so we don't serve/cache garbage as a valid Anchor IDL.
        mocks.fetchAnchorIdl.mockResolvedValueOnce({ address: CANONICAL, content: JSON.stringify({ hello: 'world' }) });

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return undefined (and warn) when fetch throws a non-Solana (decode) error', async () => {
        mocks.fetchAnchorIdl.mockRejectedValueOnce(new Error('incorrect header check'));

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).resolves.toBeUndefined();
        expect(Logger.warn).toHaveBeenCalled();
    });

    it('should re-throw SolanaErrors so the caller can classify them', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.fetchAnchorIdl.mockRejectedValueOnce(rpcError);

        await expect(resolveAnchorIdl({} as any, PROGRAM, {})).rejects.toBe(rpcError);
        expect(Logger.warn).not.toHaveBeenCalled();
    });
});

describe('resolvePmpIdl', () => {
    it('should return the canonical content without consulting fallback authorities', async () => {
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([
            { address: CANONICAL, authority: null },
            { address: FALLBACK, authority: FALLBACK },
        ]);
        mocks.fetchMetadataContent.mockResolvedValueOnce('canonical-content');

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toEqual({
            address: CANONICAL,
            authority: null,
            content: 'canonical-content',
        });
        expect(mocks.fetchMetadataContent).toHaveBeenCalledTimes(1);
    });

    it('should fall through ACCOUNT_NOT_FOUND to the next fallback authority', async () => {
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([
            { address: CANONICAL, authority: null },
            { address: FALLBACK, authority: FALLBACK },
        ]);
        mocks.fetchMetadataContent
            .mockRejectedValueOnce(new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: CANONICAL }))
            .mockResolvedValueOnce('fallback-content');

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toEqual({
            address: FALLBACK,
            authority: FALLBACK,
            content: 'fallback-content',
        });
    });

    it('should return undefined when every authority is ACCOUNT_NOT_FOUND', async () => {
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([{ address: CANONICAL, authority: null }]);
        mocks.fetchMetadataContent.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND, { address: CANONICAL }),
        );

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).resolves.toBeUndefined();
    });

    it('should re-throw non-not-found RPC errors instead of swallowing them', async () => {
        const rpcError = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'boom' });
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([{ address: CANONICAL, authority: null }]);
        mocks.fetchMetadataContent.mockRejectedValueOnce(rpcError);

        await expect(resolvePmpIdl({} as any, PROGRAM, 'idl', true)).rejects.toBe(rpcError);
    });

    it('should request canonical-only lookups (null authority) when fallbacks are disabled', async () => {
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([{ address: CANONICAL, authority: null }]);
        mocks.fetchMetadataContent.mockResolvedValueOnce('');

        await resolvePmpIdl({} as any, PROGRAM, 'security', false);

        expect(mocks.buildPmpIdlLookups).toHaveBeenCalledWith(PROGRAM, 'security', null);
    });

    it('should request fallback authorities (undefined authority) when enabled', async () => {
        mocks.buildPmpIdlLookups.mockResolvedValueOnce([{ address: CANONICAL, authority: null }]);
        mocks.fetchMetadataContent.mockResolvedValueOnce('');

        await resolvePmpIdl({} as any, PROGRAM, 'idl', true);

        expect(mocks.buildPmpIdlLookups).toHaveBeenCalledWith(PROGRAM, 'idl', undefined);
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

describe('classifySolanaError', () => {
    it('should classify known transient JSON-RPC codes as transient', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' });
        expect(classifySolanaError(error)).toBe('transient');
    });

    it('should classify transport 5xx / 429 as transient and other 4xx as misconfig', () => {
        const make = (statusCode: number) =>
            new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
                headers: {} as any,
                message: 'transport error',
                statusCode,
            });
        expect(classifySolanaError(make(503))).toBe('transient');
        expect(classifySolanaError(make(429))).toBe('transient');
        expect(classifySolanaError(make(403))).toBe('misconfig');
    });

    it('should classify unknown codes as misconfig', () => {
        const error = new SolanaError(SOLANA_ERROR__JSON_RPC__METHOD_NOT_FOUND, {
            __serverMessage: 'Method not found',
        });
        expect(classifySolanaError(error)).toBe('misconfig');
    });
});
