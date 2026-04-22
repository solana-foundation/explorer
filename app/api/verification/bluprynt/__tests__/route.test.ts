import { vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

const VALID_MINT = 'B61SyRxF2b8JwSLZHgEUF6rtn6NUikkrK1EMEgP6nhXW';
const MOCK_ATTESTATION_ADDRESS = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

const mockGetAccountInfo = vi.fn();
const mockDeriveAttestationPda = vi.fn().mockResolvedValue([MOCK_ATTESTATION_ADDRESS]);

vi.mock('sas-lib', () => ({
    deriveAttestationPda: mockDeriveAttestationPda,
}));

vi.mock('@utils/cluster', () => ({
    Cluster: { MainnetBeta: 'mainnet-beta' },
    serverClusterUrl: () => 'https://unused.test',
}));

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn().mockImplementation(() => ({
            getAccountInfo: mockGetAccountInfo,
        })),
    };
});

const { GET } = await import('../[mintAddress]/route');

describe('Bluprynt API Route', () => {
    beforeEach(() => {
        vi.stubEnv('BLUPRYNT_CREDENTIAL_AUTHORITY', 'test-credential');
        vi.stubEnv('BLUPRYNT_SCHEMA_ADDRESS', 'test-schema');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.clearAllMocks();
    });

    it('should return 400 for an invalid mint address', async () => {
        const response = await callRoute('not-a-valid-key');
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid mint address' });
    });

    it('should return 500 when credential authority is missing', async () => {
        vi.stubEnv('BLUPRYNT_CREDENTIAL_AUTHORITY', '');
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Bluprynt API is misconfigured' });
    });

    it('should return 500 when schema address is missing', async () => {
        vi.stubEnv('BLUPRYNT_SCHEMA_ADDRESS', '');
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Bluprynt API is misconfigured' });
    });

    it('should return verified true when attestation account exists', async () => {
        mockGetAccountInfo.mockResolvedValueOnce({ data: Buffer.alloc(0), lamports: 1 });
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: true });
    });

    it('should return verified false when attestation account does not exist', async () => {
        mockGetAccountInfo.mockResolvedValueOnce(null);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ verified: false });
    });

    it('should derive the attestation PDA from credential, schema, and mint address', async () => {
        mockGetAccountInfo.mockResolvedValueOnce(null);
        await callRoute(VALID_MINT);
        expect(mockDeriveAttestationPda).toHaveBeenCalledWith({
            credential: 'test-credential',
            nonce: VALID_MINT,
            schema: 'test-schema',
        });
    });

    it('should return 504 with short negative cache when RPC request times out', async () => {
        const timeoutError = new DOMException('Signal timed out.', 'TimeoutError');
        mockGetAccountInfo.mockRejectedValueOnce(timeoutError);
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(504);
        expect(await response.json()).toEqual({ error: 'Verification request timed out' });
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
        expect(Logger.warn).toHaveBeenCalledWith('[api:bluprynt] RPC request timed out', {
            mintAddress: VALID_MINT,
            sentry: true,
        });
    });

    it('should return 500 with short negative cache when RPC throws a non-timeout error', async () => {
        mockGetAccountInfo.mockRejectedValueOnce(new Error('Connection refused'));
        const response = await callRoute(VALID_MINT);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'Failed to verify bluprynt data' });
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=30');
        expect(Logger.panic).toHaveBeenCalled();
    });
});

function callRoute(mintAddress: string) {
    const request = new Request(`http://localhost:3000/api/verification/bluprynt/${mintAddress}`);
    return GET(request, { params: { mintAddress } });
}
