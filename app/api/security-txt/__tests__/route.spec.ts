import { SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, SolanaError } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

const mockAddress = '11111111111111111111111111111111';

const mocks = vi.hoisted(() => ({
    fetchElfSecurityTxt: vi.fn(),
    fetchSecurityTxt: vi.fn(),
}));

// The route resolves security.txt via `@solana/security-txt`. We mock those fetchers (keeping the
// real `isTransientRpcError` from `@solana/idl`) to assert canonical-only resolution, response
// shaping, the PMP feature gate, and error classification.
vi.mock('@solana/security-txt', () => ({
    fetchElfSecurityTxt: mocks.fetchElfSecurityTxt,
    fetchSecurityTxt: mocks.fetchSecurityTxt,
}));

vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    // The fetchers are mocked and ignore the rpc handle, so a stub is enough.
    return { ...actual, createSolanaRpc: vi.fn(() => ({})) };
});

describe('GET /api/security-txt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Logger, 'panic').mockImplementation(() => {});
        vi.spyOn(Logger, 'warn').mockImplementation(() => {});
        // PMP gate on by default; the off case is exercised explicitly below.
        vi.stubEnv('NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should return 400 when required params are missing', async () => {
        const { GET } = await importRoute();
        const cases = [
            createRequest(mockAddress, undefined), // missing cluster
            createRequest(undefined, Cluster.Devnet), // missing programAddress
        ];
        const responses = await Promise.all(cases.map(r => GET(r)));
        for (const res of responses) {
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid query params' });
        }
        expect(mocks.fetchSecurityTxt).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid program address', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest('not-a-pubkey', Cluster.MainnetBeta));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid program address' });
    });

    it('should return 400 for an invalid cluster', async () => {
        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, 999 as Cluster));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'Invalid cluster' });
    });

    it('should return the resolved security.txt (type + fields) on success', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce({
            content: '{}',
            fields: { contacts: 'mailto:security@example.com' },
            programId: mockAddress,
            type: 'pmp',
        });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
            securityTxt: { fields: { contacts: 'mailto:security@example.com' }, type: 'pmp' },
        });
        expect(res.headers.get('Cache-Control')).toContain('max-age=');
    });

    it('should omit securityTxt when none is published', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect((await res.json()).securityTxt).toBeUndefined();
    });

    it('should resolve the PMP leg canonical-only (no fallback authorities)', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce(null);

        const { GET } = await importRoute();
        await GET(createRequest(mockAddress, Cluster.MainnetBeta));

        // authority: null → canonical authority only, no fndn fallback lookups.
        expect(mocks.fetchSecurityTxt).toHaveBeenCalledWith(expect.anything(), mockAddress, { authority: null });
    });

    it('should read only the ELF section when the PMP gate is off', async () => {
        vi.stubEnv('NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED', 'false');
        mocks.fetchElfSecurityTxt.mockResolvedValueOnce({ address: mockAddress, content: '', fields: { name: 'elf' } });

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(200);
        expect(mocks.fetchSecurityTxt).not.toHaveBeenCalled();
        expect(mocks.fetchElfSecurityTxt).toHaveBeenCalledWith(expect.anything(), mockAddress);
        expect(await res.json()).toEqual({ securityTxt: { fields: { name: 'elf' }, type: 'elf' } });
    });

    it('should return a retryable 502 (no page) on a transient RPC error', async () => {
        mocks.fetchSecurityTxt.mockRejectedValueOnce(
            new SolanaError(SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR, { __serverMessage: 'Internal error' }),
        );

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Upstream RPC error' });
        expect(Logger.warn).toHaveBeenCalled();
        expect(Logger.panic).not.toHaveBeenCalled();
    });

    it('should return 502 and escalate when the fetch unexpectedly throws', async () => {
        mocks.fetchSecurityTxt.mockRejectedValueOnce(new Error('RPC connection failed'));

        const { GET } = await importRoute();
        const res = await GET(createRequest(mockAddress, Cluster.MainnetBeta));
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ error: 'Metadata fetch failed' });
        expect(Logger.panic).toHaveBeenCalled();
    });
});

function createRequest(address?: string, cluster?: Cluster) {
    const params = new URLSearchParams();
    if (address !== undefined) params.append('programAddress', address);
    if (cluster !== undefined) params.append('cluster', cluster.toString());
    return new Request(`http://localhost:3000/api/security-txt?${params}`);
}

async function importRoute() {
    return await import('../route');
}
