import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSecurityTxtClient } from '../load-fetch-security-txt';

const PROGRAM = '11111111111111111111111111111111';
const RPC_URL = 'http://localhost:8899';

const mocks = vi.hoisted(() => ({
    fetchSecurityTxt: vi.fn(),
}));

// `@solana/security-txt` is dynamically imported inside the resolver; mock the fetcher.
vi.mock('@solana/security-txt', () => ({
    fetchSecurityTxt: mocks.fetchSecurityTxt,
}));

describe('fetchSecurityTxtClient', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(() => vi.restoreAllMocks());

    it('should resolve the PMP security.txt canonical-only (with the Neodyme ELF fallback)', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });

        const result = await fetchSecurityTxtClient({ programId: PROGRAM, url: RPC_URL });

        // authority: null → canonical authority only (no fndn fallback), matching the route.
        expect(mocks.fetchSecurityTxt).toHaveBeenCalledWith(expect.anything(), PROGRAM, { authority: null });
        expect(result).toEqual({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });
    });

    it('should return undefined when no security.txt is published', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce(null);

        await expect(fetchSecurityTxtClient({ programId: PROGRAM, url: RPC_URL })).resolves.toBeUndefined();
    });
});
