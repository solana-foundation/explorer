import { gen } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAccountSizes } from '../fetch-account-sizes';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const ADDRESS_1 = PublicKey.default.toBase58();
const ADDRESS_2 = gen.publicKey(1).toBase58();

const mockGetMultipleAccounts = vi.fn();

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getMultipleAccounts: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetMultipleAccounts(...args) }),
            }),
        })),
    };
});

describe('fetchAccountSizes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should request a zero-length data slice so no account bytes are transferred', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null]);

        await fetchAccountSizes([ADDRESS_1], MAINNET_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [ADDRESS_1],
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 }, encoding: 'base64' }),
        );
    });

    it('should take each size from space rather than the returned data', async () => {
        mockGetMultipleAccounts.mockResolvedValue([
            { data: ['', 'base64'], space: 3681n },
            { data: ['', 'base64'], space: 0n },
        ]);

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], MAINNET_URL);

        expect(sizes.get(ADDRESS_1)).toBe(3681);
        expect(sizes.get(ADDRESS_2)).toBe(0);
    });

    // The default commitment is behind, so an account created moments ago would read as missing.
    it('should request sizes at the confirmed commitment', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null]);

        await fetchAccountSizes([ADDRESS_1], MAINNET_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [ADDRESS_1],
            expect.objectContaining({ commitment: 'confirmed' }),
        );
    });

    it('should omit an account whose size the node does not report', async () => {
        mockGetMultipleAccounts.mockResolvedValue([{ data: ['', 'base64'] }, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], MAINNET_URL);

        expect(sizes.has(ADDRESS_1)).toBe(false);
        expect(sizes.get(ADDRESS_2)).toBe(82);
    });

    it('should omit accounts that do not exist', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], MAINNET_URL);

        expect(sizes.has(ADDRESS_1)).toBe(false);
        expect(sizes.get(ADDRESS_2)).toBe(82);
    });
});
