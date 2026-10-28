import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type FullLegacyTokenInfo, getFullTokenInfo } from '../token-info';

describe('getFullTokenInfo', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should reject when the token info request fails and the legacy list has no entry', async () => {
        stubResponses({ legacyTokens: [], tokenInfoRoute: { ok: false, status: 503 } });

        await expect(getFullTokenInfo(MINT, Cluster.MainnetBeta)).rejects.toThrow('Token info request failed');
    });

    it('should resolve the legacy list entry when the token info request fails', async () => {
        stubResponses({ legacyTokens: [LEGACY_TOKEN], tokenInfoRoute: { ok: false, status: 503 } });

        await expect(getFullTokenInfo(MINT, Cluster.MainnetBeta)).resolves.toEqual({ ...LEGACY_TOKEN, verified: true });
    });

    it('should resolve undefined when the token info route does not list the mint', async () => {
        stubResponses({ legacyTokens: [], tokenInfoRoute: { content: [], ok: true, status: 200 } });

        await expect(getFullTokenInfo(MINT, Cluster.MainnetBeta)).resolves.toBeUndefined();
    });
});

const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const LEGACY_TOKEN: FullLegacyTokenInfo = {
    address: MINT.toBase58(),
    chainId: 101,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
};

function stubResponses({
    legacyTokens,
    tokenInfoRoute,
}: {
    legacyTokens: FullLegacyTokenInfo[];
    tokenInfoRoute: { content?: unknown; ok: boolean; status: number };
}) {
    vi.mocked(fetch).mockImplementation(async input =>
        String(input).includes('token-list')
            ? jsonResponse({ ok: true, status: 200 }, { tokens: legacyTokens })
            : jsonResponse(tokenInfoRoute, { content: tokenInfoRoute.content }),
    );
}

function jsonResponse({ ok, status }: { ok: boolean; status: number }, body: unknown) {
    return { json: async () => body, ok, status } as Response;
}
