import { gen } from '@__fixtures__/gen';
import { Compression, Encoding, Format } from '@solana-program/program-metadata';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { bufferAccountData, IDL_DOC, pack, readAs, YAML_DOC } from '../../ui/__fixtures__/pmp-account-fixtures';
import { useResolveBufferConfig } from '../use-resolve-buffer-config';

const { mockFindConfigInTransactions } = vi.hoisted(() => ({ mockFindConfigInTransactions: vi.fn() }));

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));

vi.mock('../../api/find-config-in-transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('../../api/find-config-in-transactions')>()),
    findConfigInTransactions: mockFindConfigInTransactions,
}));

const ADDRESS = gen.address(3);

/** What a `setData` declared for this buffer. Only `encoding` varies between calls, so a stale hit is unmistakable. */
function declared(encoding: Encoding) {
    return {
        config: { compression: Compression.Zlib, encoding, format: Format.Json },
        kind: 'found-for-buffer-acc',
        signature: 'sig',
    };
}

// A fresh Map provider isolates the cache per test, otherwise a fingerprint key would carry across cases.
function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

afterEach(() => vi.clearAllMocks());

describe('useResolveBufferConfig', () => {
    it('should reuse the cached lookup when a refetch returns the same bytes', async () => {
        const raw = bufferAccountData(pack(YAML_DOC, Compression.Zlib));
        mockFindConfigInTransactions.mockResolvedValue(declared(Encoding.Utf8));

        const { result, rerender } = renderHook(props => useResolveBufferConfig(props), {
            initialProps: { account: readAs(raw, 'buffer').account, address: ADDRESS },
            wrapper,
        });

        await waitFor(() => expect(result.current.configFromOnchain.status).toBe('ready'));
        expect(mockFindConfigInTransactions).toHaveBeenCalledTimes(1);

        // The provider hands back a new object on every fetch. Identical bytes must not cost a second scan.
        rerender({ account: readAs(raw, 'buffer').account, address: ADDRESS });

        await waitFor(() => expect(result.current.configFromOnchain.status).toBe('ready'));
        expect(mockFindConfigInTransactions).toHaveBeenCalledTimes(1);
    });

    it('should re-run the lookup and drop the old config when the buffer is rewritten', async () => {
        mockFindConfigInTransactions
            .mockResolvedValueOnce(declared(Encoding.Utf8))
            .mockResolvedValueOnce(declared(Encoding.Base64));

        const { result, rerender } = renderHook(props => useResolveBufferConfig(props), {
            initialProps: {
                account: readAs(bufferAccountData(pack(YAML_DOC, Compression.Zlib)), 'buffer').account,
                address: ADDRESS,
            },
            wrapper,
        });

        await waitFor(() =>
            expect(result.current.configFromOnchain).toStrictEqual({
                result: declared(Encoding.Utf8),
                status: 'ready',
            }),
        );

        rerender({
            account: readAs(bufferAccountData(pack(IDL_DOC, Compression.Zlib)), 'buffer').account,
            address: ADDRESS,
        });

        // The config the card labels the new payload with has to be the one declared for THOSE bytes.
        await waitFor(() =>
            expect(result.current.configFromOnchain).toStrictEqual({
                result: declared(Encoding.Base64),
                status: 'ready',
            }),
        );
        expect(mockFindConfigInTransactions).toHaveBeenCalledTimes(2);
    });
});
