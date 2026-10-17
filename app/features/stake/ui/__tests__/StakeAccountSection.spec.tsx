import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { render, screen } from '@testing-library/react';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import type { StakeAccountInfo } from '../../lib/validators';
import { StakeAccountSection } from '../StakeAccountSection';

const mocks = vi.hoisted(() => ({ currentEpoch: undefined as bigint | undefined }));

vi.mock('../../model/use-current-epoch', () => ({ useCurrentEpoch: () => mocks.currentEpoch }));
vi.mock('@entities/token-price', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-price')>()),
    useTokenPrice: () => undefined,
}));
vi.mock('../../model/use-total-reward', async importOriginal => {
    const actual = await importOriginal<typeof import('../../model/use-total-reward')>();
    return { ...actual, useTotalReward: () => ({ status: actual.TotalRewardStatus.Disabled }) };
});
vi.mock('@entities/account', () => ({ useRefreshAccount: () => vi.fn() }));
vi.mock('@features/account', () => ({
    AccountCard: ({ children }: { children: ReactNode }) => (
        <table>
            <tbody>{children}</tbody>
        </table>
    ),
}));
vi.mock('@components/common/KitAddress', () => ({ KitAddress: () => null }));

// Lockup of mainnet stake account H16m2XzyREuRXV78MHEee2ys88PejGm5JfvijzY819cF: the timestamp
// (2025-06-15) has passed, the epoch has not.
const AUTHORITY = address('13N4DBjLXXfbv2hYut6WF8Jt9akNy1r3bGMiZkZhYR7a');
const LOCKUP_EPOCH = 3600;
const LOCKUP_UNIX_TIMESTAMP = 1_749_976_861;

describe('StakeAccountSection', () => {
    beforeEach(() => {
        mocks.currentEpoch = 1051n;
    });

    it('should report a lockup whose epoch has not been reached', () => {
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp: LOCKUP_UNIX_TIMESTAMP });

        expect(screen.getByRole('alert')).toHaveTextContent('Account is locked! Lockup expires at epoch 3600');
    });

    it('should report both bounds while both are ahead', () => {
        const unixTimestamp = Math.floor(Date.now() / 1000) + 86_400;
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp });

        const expiry = displayTimestampUtc(unixTimestampToMs(unixTimestamp));
        expect(screen.getByRole('alert')).toHaveTextContent(
            `Account is locked! Lockup expires on ${expiry} and at epoch 3600`,
        );
    });

    it('should not report a lockup whose epoch and timestamp have both passed', () => {
        mocks.currentEpoch = 3600n;
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp: LOCKUP_UNIX_TIMESTAMP });

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should check only the timestamp until the current epoch is known', () => {
        mocks.currentEpoch = undefined;
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp: LOCKUP_UNIX_TIMESTAMP });

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    it('should report only the timestamp once the epoch has been reached', () => {
        mocks.currentEpoch = 3600n;
        const unixTimestamp = Math.floor(Date.now() / 1000) + 86_400;
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp });

        const expiry = displayTimestampUtc(unixTimestampToMs(unixTimestamp));
        expect(screen.getByRole('alert')).toHaveTextContent(`Account is locked! Lockup expires on ${expiry}`);
        expect(screen.getByRole('alert')).not.toHaveTextContent('epoch');
    });

    it('should report a future timestamp while the current epoch is unknown', () => {
        mocks.currentEpoch = undefined;
        const unixTimestamp = Math.floor(Date.now() / 1000) + 86_400;
        renderSection({ epoch: LOCKUP_EPOCH, unixTimestamp });

        const expiry = displayTimestampUtc(unixTimestampToMs(unixTimestamp));
        expect(screen.getByRole('alert')).toHaveTextContent(`Account is locked! Lockup expires on ${expiry}`);
        expect(screen.getByRole('alert')).not.toHaveTextContent('epoch');
    });
});

function renderSection(lockup: { epoch: number; unixTimestamp: number }) {
    const stakeAccount: StakeAccountInfo = {
        meta: {
            authorized: { staker: AUTHORITY, withdrawer: AUTHORITY },
            lockup: { custodian: AUTHORITY, ...lockup },
            rentExemptReserve: 2_282_880n,
        },
        stake: null,
    };
    const account: Account = {
        data: {},
        executable: false,
        lamports: 12_285_748,
        owner: toLegacyPublicKey(STAKE_PROGRAM_ADDRESS),
        pubkey: toLegacyPublicKey(address('H16m2XzyREuRXV78MHEee2ys88PejGm5JfvijzY819cF')),
        space: 200,
    };
    return render(<StakeAccountSection account={account} stakeAccount={stakeAccount} stakeAccountType="initialized" />);
}
