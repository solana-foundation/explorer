import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';

import { type KeyValueRowInput, KeyValueRows, StackedList } from '@/app/shared/ui/key-value';

import { VoteAccount } from '../lib/validators';

export function VoteAccountSection({ account, voteAccount }: { account: Account; voteAccount: VoteAccount }) {
    const refresh = useRefreshAccount();
    const rootSlot = voteAccount.info.rootSlot;

    const rows: KeyValueRowInput[] = [
        {
            label: `Authorized Voter${voteAccount.info.authorizedVoters.length > 1 ? 's' : ''}`,
            value: (
                <StackedList>
                    {voteAccount.info.authorizedVoters.map(voter => (
                        // The same voter can appear once per epoch, so the pubkey alone is not unique
                        <li key={`${voter.epoch}-${voter.authorizedVoter.toString()}`}>
                            <Address pubkey={voter.authorizedVoter} raw link />
                        </li>
                    ))}
                </StackedList>
            ),
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
        voteAccount.info.blsPubkeyCompressed && {
            label: 'BLS Pubkey',
            value: voteAccount.info.blsPubkeyCompressed,
            valueClassName: 'font-mono',
        },
        voteAccount.info.inflationRewardsCommissionBps !== undefined && {
            label: 'Inflation Rewards Commission',
            value: `${voteAccount.info.inflationRewardsCommissionBps / 100}%`,
        },
        voteAccount.info.inflationRewardsCollector && {
            label: 'Inflation Rewards Collector',
            value: <Address pubkey={voteAccount.info.inflationRewardsCollector} raw link />,
        },
        voteAccount.info.blockRevenueCommissionBps !== undefined && {
            label: 'Block Revenue Commission',
            value: `${voteAccount.info.blockRevenueCommissionBps / 100}%`,
        },
        voteAccount.info.blockRevenueCollector && {
            label: 'Block Revenue Collector',
            value: <Address pubkey={voteAccount.info.blockRevenueCollector} raw link />,
        },
        voteAccount.info.pendingDelegatorRewards !== undefined && {
            label: 'Pending Delegator Rewards (SOL)',
            value: <SolBalance lamports={BigInt(voteAccount.info.pendingDelegatorRewards)} />,
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
