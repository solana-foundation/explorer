import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isStakeAccount } from '../is-stake-account';

const ADDRESS = address(gen.address(0));
const RPC_URL = 'https://rpc.example';

const mocks = vi.hoisted(() => ({ getAccountInfo: vi.fn() }));

// The global kit mock in `test-setup.specs.ts` serves an RPC stub without `getAccountInfo`; per its
// own note, tests needing other methods override it locally.
vi.mock('@solana/kit', async () => {
    const actual = await vi.importActual<typeof import('@solana/kit')>('@solana/kit');
    return { ...actual, createSolanaRpc: vi.fn(() => ({ getAccountInfo: mocks.getAccountInfo })) };
});

describe('isStakeAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should accept an account owned by the stake program', async () => {
        mockOwner(STAKE_PROGRAM_ADDRESS);

        await expect(isStakeAccount({ address: ADDRESS, rpcUrl: RPC_URL })).resolves.toBe(true);
    });

    it('should reject an account owned by another program', async () => {
        mockOwner(SYSTEM_PROGRAM_ADDRESS);

        await expect(isStakeAccount({ address: ADDRESS, rpcUrl: RPC_URL })).resolves.toBe(false);
    });

    it('should reject an address that holds no account', async () => {
        mockValue(undefined);

        await expect(isStakeAccount({ address: ADDRESS, rpcUrl: RPC_URL })).resolves.toBe(false);
    });

    it('should request no account data, since only the owner is read', async () => {
        mockOwner(STAKE_PROGRAM_ADDRESS);

        await isStakeAccount({ address: ADDRESS, rpcUrl: RPC_URL });

        expect(mocks.getAccountInfo).toHaveBeenCalledWith(
            ADDRESS,
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 } }),
        );
    });

    it('should propagate an RPC failure rather than reporting "not a stake account"', async () => {
        mocks.getAccountInfo.mockReturnValue({ send: vi.fn().mockRejectedValue(new Error('rpc down')) });

        await expect(isStakeAccount({ address: ADDRESS, rpcUrl: RPC_URL })).rejects.toThrow('rpc down');
    });
});

function mockOwner(owner: string) {
    mockValue({ executable: false, lamports: 1n, owner, rentEpoch: 0n, space: 200n });
}

function mockValue(value: unknown) {
    // The RPC reports a missing account as `value: null`, so mirror that rather than `undefined`.
    mocks.getAccountInfo.mockReturnValue({
        send: vi.fn().mockResolvedValue({ context: { slot: 1n }, value: value ?? null }),
    });
}
