import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAccountSizes } from '../fetch-account-sizes';

const ADDRESS_1 = gen.address(1);
const ADDRESS_2 = gen.address(2);

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

        await fetchAccountSizes([ADDRESS_1], DEFAULT_RPC_URL);

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

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL);

        expect(sizes.get(ADDRESS_1)).toBe(3681);
        expect(sizes.get(ADDRESS_2)).toBe(0);
    });

    it('should request sizes at the confirmed commitment', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null]);

        await fetchAccountSizes([ADDRESS_1], DEFAULT_RPC_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [ADDRESS_1],
            expect.objectContaining({ commitment: 'confirmed' }),
        );
    });

    it('should omit an account whose size the node does not report', async () => {
        mockGetMultipleAccounts.mockResolvedValue([{ data: ['', 'base64'] }, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL);

        expect(sizes.has(ADDRESS_1)).toBe(false);
        expect(sizes.get(ADDRESS_2)).toBe(82);
    });

    it('should count an account that does not exist as zero bytes', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL);

        expect(sizes.get(ADDRESS_1)).toBe(0);
        expect(sizes.get(ADDRESS_2)).toBe(82);
    });
});
