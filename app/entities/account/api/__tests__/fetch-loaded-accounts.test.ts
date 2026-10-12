import { DEFAULT_RPC_URL, gen } from '@__fixtures__/gen';
import { address, getAddressEncoder, getU32Encoder } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toBase64 } from '@/app/shared/lib/bytes';

import { fetchLoadedAccounts } from '../fetch-loaded-accounts';

const ADDRESS_1 = gen.address(1);
const ADDRESS_2 = gen.address(2);
const PROGRAM = gen.address(3);
const PROGRAM_DATA = gen.address(4);
const UPGRADEABLE_LOADER_ID = 'BPFLoaderUpgradeab1e11111111111111111111111';
const INSTRUCTIONS_SYSVAR_ID = 'Sysvar1nstructions1111111111111111111111111';

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

describe('fetchLoadedAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should request only the program state window of each account', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null]);

        await fetchLoadedAccounts([ADDRESS_1], DEFAULT_RPC_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [ADDRESS_1],
            expect.objectContaining({
                commitment: 'confirmed',
                dataSlice: { length: 36, offset: 0 },
                encoding: 'base64',
            }),
        );
    });

    it('should split a list longer than one request accepts into batches', async () => {
        mockGetMultipleAccounts.mockImplementation(async addresses => addresses.map(() => dataAccount(1n)));
        const addresses = Array.from({ length: 150 }, (_, i) => gen.address(100 + i));

        await expect(fetchLoadedAccounts(addresses, DEFAULT_RPC_URL)).resolves.toEqual({
            accountCount: 150,
            dataSize: 150,
        });
        expect(mockGetMultipleAccounts.mock.calls.map(([batch]) => batch.length)).toEqual([100, 50]);
    });

    it('should sum the sizes the node reports in space', async () => {
        mockGetMultipleAccounts.mockResolvedValue([dataAccount(3681n), dataAccount(82n)]);

        await expect(fetchLoadedAccounts([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL)).resolves.toEqual({
            accountCount: 2,
            dataSize: 3763,
        });
    });

    it('should not charge for an account that does not exist', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null, dataAccount(82n)]);

        await expect(fetchLoadedAccounts([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL)).resolves.toEqual({
            accountCount: 1,
            dataSize: 82,
        });
    });

    it('should leave out the instructions sysvar, which the runtime never loads', async () => {
        mockGetMultipleAccounts.mockResolvedValue([dataAccount(82n)]);

        await fetchLoadedAccounts([ADDRESS_1, INSTRUCTIONS_SYSVAR_ID], DEFAULT_RPC_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith([ADDRESS_1], expect.anything());
    });

    it('should report no total when the node omits a size', async () => {
        mockGetMultipleAccounts.mockResolvedValue([{ ...dataAccount(0n), space: undefined }, dataAccount(82n)]);

        await expect(fetchLoadedAccounts([ADDRESS_1, ADDRESS_2], DEFAULT_RPC_URL)).resolves.toBeUndefined();
    });

    it('should add the program data behind an upgradeable program', async () => {
        mockGetMultipleAccounts
            .mockResolvedValueOnce([programAccount(PROGRAM_DATA), dataAccount(165n)])
            .mockResolvedValueOnce([dataAccount(1_000_045n)]);

        const loaded = await fetchLoadedAccounts([PROGRAM, ADDRESS_1], DEFAULT_RPC_URL);

        expect(loaded).toEqual({ accountCount: 3, dataSize: 36 + 165 + 1_000_045 });
        expect(mockGetMultipleAccounts).toHaveBeenLastCalledWith(
            [PROGRAM_DATA],
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 } }),
        );
    });

    it('should count a program data account the list already names once', async () => {
        mockGetMultipleAccounts.mockResolvedValueOnce([programAccount(PROGRAM_DATA), dataAccount(1_000_045n)]);

        const loaded = await fetchLoadedAccounts([PROGRAM, PROGRAM_DATA], DEFAULT_RPC_URL);

        expect(loaded).toEqual({ accountCount: 2, dataSize: 36 + 1_000_045 });
        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1);
    });

    it('should not follow an account the upgradeable loader owns that is not a program', async () => {
        const programData = { ...programAccount(PROGRAM_DATA, 3), space: 1_000_045n };
        mockGetMultipleAccounts.mockResolvedValueOnce([programData]);

        await expect(fetchLoadedAccounts([ADDRESS_1], DEFAULT_RPC_URL)).resolves.toEqual({
            accountCount: 1,
            dataSize: 1_000_045,
        });
        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1);
    });

    it('should count a program whose program data does not exist without failing', async () => {
        mockGetMultipleAccounts.mockResolvedValueOnce([programAccount(PROGRAM_DATA)]).mockResolvedValueOnce([null]);

        await expect(fetchLoadedAccounts([PROGRAM], DEFAULT_RPC_URL)).resolves.toEqual({
            accountCount: 1,
            dataSize: 36,
        });
    });
});

function dataAccount(space: bigint) {
    return { data: ['', 'base64'], executable: false, owner: gen.address(9), space };
}

// State 2 is a program; 3 is program data.
function programAccount(programData: string, state = 2) {
    const window = new Uint8Array(36);
    window.set(getU32Encoder().encode(state));
    window.set(getAddressEncoder().encode(address(programData)), 4);
    return { data: [toBase64(window), 'base64'], executable: state === 2, owner: UPGRADEABLE_LOADER_ID, space: 36n };
}
