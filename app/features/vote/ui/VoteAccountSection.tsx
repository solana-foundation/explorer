import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

import { VoteAccount } from '../lib/validators';

export function VoteAccountSection({ account, voteAccount }: { account: Account; voteAccount: VoteAccount }) {
    const refresh = useRefreshAccount();
    const rootSlot = voteAccount.info.rootSlot;

    const rows: KeyValueRow[] = [
        {
            label: `Authorized Voter${voteAccount.info.authorizedVoters.length > 1 ? 's' : ''}`,
            value: voteAccount.info.authorizedVoters.map(voter => {
                // The same voter can appear once per epoch, so the pubkey alone is not unique
                return (
                    <Address
                        pubkey={voter.authorizedVoter}
                        key={`${voter.epoch}-${voter.authorizedVoter.toString()}`}
                        raw
                        link
                    />
                );
            }),
        },
        {
            label: 'Authorized Withdrawer',
            value: <Address pubkey={voteAccount.info.authorizedWithdrawer} raw link />,
        },
        {
            label: 'Last Timestamp',
            value: displayTimestamp(voteAccount.info.lastTimestamp.timestamp * 1000),
            valueClassName: 'font-mono',
        },
        { label: 'Commission', value: `${voteAccount.info.commission}%` },
        {
            label: 'BLS Pubkey',
            show: Boolean(voteAccount.info.blsPubkeyCompressed),
            value: voteAccount.info.blsPubkeyCompressed,
            valueClassName: 'font-mono',
        },
        {
            label: 'Inflation Rewards Commission',
            show: voteAccount.info.inflationRewardsCommissionBps !== undefined,
            value:
                voteAccount.info.inflationRewardsCommissionBps !== undefined &&
                `${voteAccount.info.inflationRewardsCommissionBps / 100}%`,
        },
        {
            label: 'Inflation Rewards Collector',
            show: Boolean(voteAccount.info.inflationRewardsCollector),
            value: voteAccount.info.inflationRewardsCollector && (
                <Address pubkey={voteAccount.info.inflationRewardsCollector} raw link />
            ),
        },
        {
            label: 'Block Revenue Commission',
            show: voteAccount.info.blockRevenueCommissionBps !== undefined,
            value:
                voteAccount.info.blockRevenueCommissionBps !== undefined &&
                `${voteAccount.info.blockRevenueCommissionBps / 100}%`,
        },
        {
            label: 'Block Revenue Collector',
            show: Boolean(voteAccount.info.blockRevenueCollector),
            value: voteAccount.info.blockRevenueCollector && (
                <Address pubkey={voteAccount.info.blockRevenueCollector} raw link />
            ),
        },
        {
            label: 'Pending Delegator Rewards (SOL)',
            show: voteAccount.info.pendingDelegatorRewards !== undefined,
            value: voteAccount.info.pendingDelegatorRewards !== undefined && (
                <SolBalance lamports={BigInt(voteAccount.info.pendingDelegatorRewards)} />
            ),
        },
        {
            label: 'Root Slot',
            value: rootSlot !== null ? <Slot slot={rootSlot} link /> : 'N/A',
        },
    ];

    return (
        <AccountCard
            title="Vote Account"
            account={account}
            analyticsSection="vote_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}
