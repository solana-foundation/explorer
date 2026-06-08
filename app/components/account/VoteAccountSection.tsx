import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';
import { VoteAccount } from '@validators/accounts/vote';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

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
                <BaseTable.Cell className="e-text-right">
                    {voteAccount.info.authorizedVoters.map(voter => {
                        return (
                            <Address
                                pubkey={voter.authorizedVoter}
                                key={voter.authorizedVoter.toString()}
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
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={voteAccount.info.authorizedWithdrawer} alignRight raw link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Last Timestamp</BaseTable.Cell>
                <BaseTable.Cell className="font-monospace e-text-right">
                    {displayTimestamp(voteAccount.info.lastTimestamp.timestamp * 1000)}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Commission</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{`${voteAccount.info.commission}%`}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Root Slot</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {rootSlot !== null ? <Slot slot={rootSlot} link /> : 'N/A'}
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}
