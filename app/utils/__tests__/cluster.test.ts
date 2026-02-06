import { afterEach, describe, expect, it, vi } from 'vitest';

import { modifyUrl } from '../cluster';

describe('modifyUrl', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns url unchanged when hostname is localhost', () => {
        vi.stubGlobal('location', { hostname: 'localhost' });

        expect(modifyUrl('https://api.mainnet.solana.com')).toBe('https://api.mainnet.solana.com');
        expect(modifyUrl('https://api.devnet.solana.com')).toBe('https://api.devnet.solana.com');
    });

    it('replaces "api" with "explorer-api" when hostname is not localhost', () => {
        vi.stubGlobal('location', { hostname: 'explorer.solana.com' });

        expect(modifyUrl('https://api.mainnet.solana.com')).toBe('https://explorer-api.mainnet.solana.com');
        expect(modifyUrl('https://api.devnet.solana.com')).toBe('https://explorer-api.devnet.solana.com');
    });

    it('returns url unchanged when url has no "api" and hostname is not localhost', () => {
        vi.stubGlobal('location', { hostname: 'explorer.solana.com' });

        expect(modifyUrl('https://simd-0296.surfnet.dev:8899')).toBe('https://simd-0296.surfnet.dev:8899');
    });
});
