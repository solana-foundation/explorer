import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';

import { BaseTable } from '@/app/shared/ui/Table';

import { VoteAccount } from '../lib/validators';

export function VoteAccountSection({ account, voteAccount }: { account: Account; voteAccount: VoteAccount }) {
    const refresh = useRefreshAccount();
    const rootSlot = voteAccount.info.rootSlot;
    return (
        <AccountCard
            title="Vote Account"
            account={account}
            analyticsSection="vote_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>
                    Authorized Voter
                    {voteAccount.info.authorizedVoters.length > 1 ? 's' : ''}
                </BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {voteAccount.info.authorizedVoters.map(voter => {
                        // The same voter can appear once per epoch, so the pubkey alone is not unique
                        return (
                            <Address
                                pubkey={voter.authorizedVoter}
                                key={`${voter.epoch}-${voter.authorizedVoter.toString()}`}
                                alignRight
                                raw
                                link
                            />
                        );
                    })}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Authorized Withdrawer</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={voteAccount.info.authorizedWithdrawer} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Last Timestamp</BaseTable.Cell>
                <BaseTable.Cell className="text-right font-mono">
                    {displayTimestamp(voteAccount.info.lastTimestamp.timestamp * 1000)}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Commission</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{`${voteAccount.info.commission}%`}</BaseTable.Cell>
            </BaseTable.Row>

            {voteAccount.info.blsPubkeyCompressed && (
                <BaseTable.Row>
                    <BaseTable.Cell>BLS Pubkey</BaseTable.Cell>
                    <BaseTable.Cell className="text-right font-mono">
                        {voteAccount.info.blsPubkeyCompressed}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {voteAccount.info.inflationRewardsCommissionBps !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Inflation Rewards Commission</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {`${voteAccount.info.inflationRewardsCommissionBps / 100}%`}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {voteAccount.info.inflationRewardsCollector && (
                <BaseTable.Row>
                    <BaseTable.Cell>Inflation Rewards Collector</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={voteAccount.info.inflationRewardsCollector} alignRight raw link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {voteAccount.info.blockRevenueCommissionBps !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Block Revenue Commission</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {`${voteAccount.info.blockRevenueCommissionBps / 100}%`}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {voteAccount.info.blockRevenueCollector && (
                <BaseTable.Row>
                    <BaseTable.Cell>Block Revenue Collector</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={voteAccount.info.blockRevenueCollector} alignRight raw link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {voteAccount.info.pendingDelegatorRewards !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Pending Delegator Rewards (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <SolBalance lamports={BigInt(voteAccount.info.pendingDelegatorRewards)} />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Root Slot</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {rootSlot !== null ? <Slot slot={rootSlot} link /> : 'N/A'}
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}
