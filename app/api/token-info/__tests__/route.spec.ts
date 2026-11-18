import { beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { TOKEN_INFO_REQUEST_LIMIT, type TokenInfo } from '@/app/entities/token-info/server';
import { Cluster } from '@/app/utils/cluster';

// The route treats a mint as an opaque, well-formed address, so generated ones say more about
// what is under test than real mints would.
const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

const mocks = vi.hoisted(() => ({ lookupTokenInfos: vi.fn() }));

vi.mock('@entities/token-info/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
    return { ...actual, lookupTokenInfos: mocks.lookupTokenInfos };
});

function token(address: string, overrides: Partial<TokenInfo> = {}): TokenInfo {
    return {
        address,
        decimals: 6,
        name: `Token ${address.slice(0, 4)}`,
        symbol: 'TKN',
        verified: true,
        ...overrides,
    };
}

describe('POST /api/token-info', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.lookupTokenInfos.mockResolvedValue(resolved([]));
    });

    it('should return 400 when the body is not valid JSON', async () => {
        const { POST } = await importRoute();
        const res = await POST(new Request('http://localhost:3000/api/token-info', { body: 'nope', method: 'POST' }));

        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid request' });
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when addresses is missing', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ cluster: Cluster.Mainnet }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 for a malformed address', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A, 'not-a-pubkey'], cluster: Cluster.Mainnet }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 for an unsupported cluster', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: 999 }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when the cluster is not a number', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: '0' }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return 400 when the genesis hash is not a string', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: 42 }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should ignore keys it does not know', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Mainnet, verbose: true }));

        expect(res.status).toBe(200);
    });

    it('should return 400 when more distinct addresses than the cap are requested', async () => {
        const { POST } = await importRoute();
        const addresses = Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, i) => gen.address(i));
        const res = await POST(createRequest({ addresses, cluster: Cluster.Mainnet }));

        expect(res.status).toBe(400);
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should accept a request whose repeats push it over the cap only before de-duplication', async () => {
        const { POST } = await importRoute();
        const addresses = Array.from({ length: 400 }, () => MINT_A);
        const res = await POST(createRequest({ addresses, cluster: Cluster.Mainnet }));

        expect(res.status).toBe(200);
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith(
            expect.objectContaining({ addresses: [MINT_A], cluster: Cluster.Mainnet, genesisHash: undefined }),
        );
    });

    it('should resolve several addresses in one request', async () => {
        mocks.lookupTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A), token(MINT_B)]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet }));

        expect(await res.json()).toEqual({ content: [token(MINT_A), token(MINT_B)] });
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith(
            expect.objectContaining({ addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet, genesisHash: undefined }),
        );
    });

    it('should de-duplicate repeated addresses', async () => {
        const { POST } = await importRoute();
        await POST(createRequest({ addresses: [MINT_A, MINT_A, MINT_B], cluster: Cluster.Mainnet }));

        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith(
            expect.objectContaining({ addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet, genesisHash: undefined }),
        );
    });

    it('should forward the genesis hash so a custom cluster can resolve a chain id', async () => {
        const genesisHash = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash }));

        expect(res.status).toBe(200);
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith(
            expect.objectContaining({ addresses: [MINT_A], cluster: Cluster.Custom, genesisHash }),
        );
    });

    it('should not read on-chain metadata unless the caller opts in', async () => {
        mocks.lookupTokenInfos.mockResolvedValueOnce(resolved([]));

        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [MINT_A], cluster: Cluster.Mainnet }));

        expect(await res.json()).toEqual({ content: [] });
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith({
            addresses: [MINT_A],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: false,
        });
    });

    it('should read on-chain metadata when the caller opts in', async () => {
        mocks.lookupTokenInfos.mockResolvedValueOnce(resolved([token(MINT_A), token(MINT_B, { verified: false })]));

        const { POST } = await importRoute();
        const res = await POST(
            createRequest({ addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet, includeOnChainFallback: true }),
        );

        expect(await res.json()).toEqual({ content: [token(MINT_A), token(MINT_B, { verified: false })] });
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith({
            addresses: [MINT_A, MINT_B],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            includeOnChainFallback: true,
        });
    });

    it('should answer with an empty list for an empty addresses array', async () => {
        const { POST } = await importRoute();
        const res = await POST(createRequest({ addresses: [], cluster: Cluster.Mainnet }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ content: [] });
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });
});

function resolved(tokens: TokenInfo[]) {
    return { kind: 'resolved', tokens };
}

function createRequest(body: Record<string, unknown>) {
    return new Request('http://localhost:3000/api/token-info', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
    });
}

async function importRoute() {
    return await import('../route');
}
