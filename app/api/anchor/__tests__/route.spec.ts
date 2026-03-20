import { Idl, Program } from '@coral-xyz/anchor';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

vi.mock('@coral-xyz/anchor', async () => {
    const actual = await vi.importActual('@coral-xyz/anchor');
    return {
        ...actual,
        Program: {
            fetchIdl: vi.fn(),
        },
    };
});

vi.mock('@coral-xyz/anchor/dist/cjs/nodewallet', () => ({
    default: vi.fn().mockImplementation(() => ({})),
}));

const VALID_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

describe('GET /api/anchor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 when programAddress is missing', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta) }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid query params' });
    });

    it('should return 400 when cluster is missing', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ programAddress: VALID_ADDRESS }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid query params' });
    });

    it('should return 400 for an invalid cluster value', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: '999', programAddress: VALID_ADDRESS }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: 'not-a-pubkey' }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should return IDL on success', async () => {
        const fakeIdl: Idl = {
            address: VALID_ADDRESS,
            instructions: [],
            metadata: { name: 'test', spec: '0.1.0', version: '0.1.0' },
        };
        vi.mocked(Program.fetchIdl).mockResolvedValueOnce(fakeIdl);

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: VALID_ADDRESS }));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ idl: fakeIdl });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should return 502 with a generic message when fetchIdl throws', async () => {
        const internalError = Object.assign(new Error('AccountNotFoundError'), {
            context: { rpcUrl: 'https://internal-rpc.company.com:8899' },
            logs: ['Program log: secret stuff'],
        });
        vi.mocked(Program.fetchIdl).mockRejectedValueOnce(internalError);

        const { GET } = await importRoute();
        const res = await GET(createRequest({ cluster: String(Cluster.MainnetBeta), programAddress: VALID_ADDRESS }));

        expect(res.status).toBe(502);
        const body = await res.json();
        expect(body).toEqual({ error: 'Failed to fetch IDL' });

        // Verify no internal details leaked
        const bodyStr = JSON.stringify(body);
        expect(bodyStr).not.toContain('internal-rpc.company.com');
        expect(bodyStr).not.toContain('secret stuff');
    });
});

function createRequest(params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams(params);
    return new Request(`http://localhost:3000/api/anchor?${searchParams}`);
}

async function importRoute() {
    return await import('../route');
}
