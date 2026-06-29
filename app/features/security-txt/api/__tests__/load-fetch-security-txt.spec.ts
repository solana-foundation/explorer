import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSecurityTxtClient } from '../load-fetch-security-txt';

const PROGRAM = '11111111111111111111111111111111';
const RPC_URL = 'http://localhost:8899';

const mocks = vi.hoisted(() => ({
    fetchElfSecurityTxt: vi.fn(),
    fetchSecurityTxt: vi.fn(),
}));

// `@solana/security-txt` is dynamically imported inside the resolver; mock both fetchers.
vi.mock('@solana/security-txt', () => ({
    fetchElfSecurityTxt: mocks.fetchElfSecurityTxt,
    fetchSecurityTxt: mocks.fetchSecurityTxt,
}));

// The fetchers ignore the rpc handle (it's mocked), so a stub is enough; keep the real `address`.
vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return { ...actual, createSolanaRpc: vi.fn(() => ({})) };
});

describe('fetchSecurityTxtClient', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it('should resolve the PMP security.txt canonical-only when includePmp is true', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });

        const result = await fetchSecurityTxtClient({ includePmp: true, programId: PROGRAM, url: RPC_URL });

        // authority: null → canonical authority only (no fndn fallback), matching the route.
        expect(mocks.fetchSecurityTxt).toHaveBeenCalledWith(expect.anything(), PROGRAM, { authority: null });
        expect(mocks.fetchElfSecurityTxt).not.toHaveBeenCalled();
        expect(result).toEqual({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });
    });

    it('should read only the Neodyme ELF section when includePmp is false', async () => {
        mocks.fetchElfSecurityTxt.mockResolvedValueOnce({ fields: { name: 'elf-program' } });

        const result = await fetchSecurityTxtClient({ includePmp: false, programId: PROGRAM, url: RPC_URL });

        expect(mocks.fetchElfSecurityTxt).toHaveBeenCalledWith(expect.anything(), PROGRAM);
        expect(mocks.fetchSecurityTxt).not.toHaveBeenCalled();
        expect(result).toEqual({ fields: { name: 'elf-program' }, type: 'elf' });
    });

    it('should return undefined when no security.txt is published', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce(null);
        mocks.fetchElfSecurityTxt.mockResolvedValueOnce(null);

        await expect(
            fetchSecurityTxtClient({ includePmp: true, programId: PROGRAM, url: RPC_URL }),
        ).resolves.toBeUndefined();
        await expect(
            fetchSecurityTxtClient({ includePmp: false, programId: PROGRAM, url: RPC_URL }),
        ).resolves.toBeUndefined();
    });
});
