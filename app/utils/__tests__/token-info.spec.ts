import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getFullTokenInfo } from '../token-info';

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

describe('getFullTokenInfo', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should reject when the token info request fails', async () => {
        stubResponse({ ok: false, status: 503 });

        await expect(getFullTokenInfo(MINT, Cluster.Mainnet)).rejects.toThrow('Token info request failed');
    });

    it('should resolve undefined when the token info route does not list the mint', async () => {
        stubResponse({ content: [], ok: true, status: 200 });

        await expect(getFullTokenInfo(MINT, Cluster.Mainnet)).resolves.toBeUndefined();
    });

    it('should resolve the route entry with the chain id and without the verified flag', async () => {
        stubResponse({ content: [tokenInfo(MINT.toBase58(), true)], ok: true, status: 200 });

        await expect(getFullTokenInfo(MINT, Cluster.Mainnet)).resolves.toEqual({
            address: MINT.toBase58(),
            chainId: 101,
            decimals: 6,
            name: MINT.toBase58(),
            symbol: MINT.toBase58(),
        });
    });
});

const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

function stubResponse(tokenInfoRoute: { content?: unknown; ok: boolean; status: number }) {
    vi.mocked(fetch).mockImplementation(async () => jsonResponse(tokenInfoRoute, { content: tokenInfoRoute.content }));
}

function jsonResponse({ ok, status }: { ok: boolean; status: number }, body: unknown) {
    return { json: async () => body, ok, status } as Response;
}
