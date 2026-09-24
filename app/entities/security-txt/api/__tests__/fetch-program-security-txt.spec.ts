import { address } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetchSecurityTxt: vi.fn() }));

// The library is dynamically imported inside the resolver; mock the fetcher.
vi.mock('@solana/security-txt', () => ({ fetchSecurityTxt: mocks.fetchSecurityTxt }));

import { fetchProgramSecurityTxt } from '../fetch-program-security-txt';

const PROGRAM = address('11111111111111111111111111111111');
// A throwaway rpc handle: the underlying fetcher is mocked, so its shape never matters.
const RPC = {} as Parameters<typeof fetchProgramSecurityTxt>[0];

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('fetchProgramSecurityTxt', () => {
    it('should resolve canonical-only (no fndn fallback) and normalize to type + fields', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });

        const result = await fetchProgramSecurityTxt(RPC, PROGRAM);

        expect(mocks.fetchSecurityTxt).toHaveBeenCalledWith(RPC, PROGRAM, { authority: null });
        expect(result).toEqual({ fields: { contacts: 'mailto:sec@example.com' }, type: 'pmp' });
    });

    it('should return undefined when no security.txt is published', async () => {
        mocks.fetchSecurityTxt.mockResolvedValueOnce(null);

        await expect(fetchProgramSecurityTxt(RPC, PROGRAM)).resolves.toBeUndefined();
    });
});
