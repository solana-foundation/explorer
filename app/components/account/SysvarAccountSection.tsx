import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Epoch } from '@components/common/Epoch';
import { Slot } from '@components/common/Slot';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp, unixTimestampToMs } from '@utils/date';
import {
    SysvarAccount,
    SysvarClockAccount,
    SysvarEpochScheduleAccount,
    SysvarFeesAccount,
    SysvarRecentBlockhashesAccount,
    SysvarRentAccount,
    SysvarRewardsAccount,
    SysvarSlotHashesAccount,
    SysvarSlotHistoryAccount,
    SysvarStakeHistoryAccount,
} from '@validators/accounts/sysvar';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

export function SysvarAccountSection({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarAccount }) {
    switch (sysvarAccount.type) {
        case 'clock':
            return <SysvarAccountClockCard account={account} sysvarAccount={sysvarAccount} />;
        case 'rent':
            return <SysvarAccountRentCard account={account} sysvarAccount={sysvarAccount} />;
        case 'rewards':
            return <SysvarAccountRewardsCard account={account} sysvarAccount={sysvarAccount} />;
        case 'epochSchedule':
            return <SysvarAccountEpochScheduleCard account={account} sysvarAccount={sysvarAccount} />;
        case 'fees':
            return <SysvarAccountFeesCard account={account} sysvarAccount={sysvarAccount} />;
        case 'recentBlockhashes':
            return <SysvarAccountRecentBlockhashesCard account={account} sysvarAccount={sysvarAccount} />;
        case 'slotHashes':
            return <SysvarAccountSlotHashes account={account} sysvarAccount={sysvarAccount} />;
        case 'slotHistory':
            return <SysvarAccountSlotHistory account={account} sysvarAccount={sysvarAccount} />;
        case 'stakeHistory':
            return <SysvarAccountStakeHistory account={account} sysvarAccount={sysvarAccount} />;
    }
}

function SysvarAccountRecentBlockhashesCard({
    account,
}: {
    account: Account;
    sysvarAccount: SysvarRecentBlockhashesAccount;
}) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Recent Blockhashes"
            account={account}
            analyticsSection="sysvar_recent_blockhashes_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
        </AccountCard>
    );
}

function SysvarAccountSlotHashes({ account }: { account: Account; sysvarAccount: SysvarSlotHashesAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Slot Hashes"
            account={account}
            analyticsSection="sysvar_slot_hashes_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
        </AccountCard>
    );
}

function SysvarAccountSlotHistory({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarSlotHistoryAccount;
}) {
    const refresh = useRefreshAccount();
    const history = Array.from(
        {
            length: 100,
        },
        (v, k) => sysvarAccount.info.nextSlot - k,
    );
    return (
        <AccountCard
            title="Sysvar: Slot History"
            account={account}
            analyticsSection="sysvar_slot_history_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell className="e-align-top">
                    Slot History <span className="e-text-dk-gray-700">(previous 100 slots)</span>
                </BaseTable.Cell>
                <BaseTable.Cell className="e-font-mono e-text-right">
                    {history.map(val => (
                        <p key={val} className="e-mb-0">
                            <Slot slot={val} link />
                        </p>
                    ))}
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function SysvarAccountStakeHistory({ account }: { account: Account; sysvarAccount: SysvarStakeHistoryAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Stake History"
            account={account}
            analyticsSection="sysvar_stake_history_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
        </AccountCard>
    );
}

function SysvarAccountFeesCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarFeesAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Fees"
            account={account}
            analyticsSection="sysvar_fees_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Lamports Per Signature</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {sysvarAccount.info.feeCalculator.lamportsPerSignature}
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function SysvarAccountEpochScheduleCard({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarEpochScheduleAccount;
}) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Epoch Schedule"
            account={account}
            analyticsSection="sysvar_epoch_schedule_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Slots Per Epoch</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{sysvarAccount.info.slotsPerEpoch}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Leader Schedule Slot Offset</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{sysvarAccount.info.leaderScheduleSlotOffset}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Epoch Warmup Enabled</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <code>{sysvarAccount.info.warmup ? 'true' : 'false'}</code>
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>First Normal Epoch</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{sysvarAccount.info.firstNormalEpoch}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>First Normal Slot</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Slot slot={sysvarAccount.info.firstNormalSlot} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function SysvarAccountClockCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarClockAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Clock"
            account={account}
            analyticsSection="sysvar_clock_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Timestamp</BaseTable.Cell>
                <BaseTable.Cell className="e-font-mono e-text-right">
                    {displayTimestamp(unixTimestampToMs(sysvarAccount.info.unixTimestamp))}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Epoch</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Epoch epoch={sysvarAccount.info.epoch} link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Leader Schedule Epoch</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Epoch epoch={sysvarAccount.info.leaderScheduleEpoch} link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Slot</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Slot slot={sysvarAccount.info.slot} link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function SysvarAccountRentCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarRentAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Sysvar: Rent"
            account={account}
            analyticsSection="sysvar_rent_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Burn Percent</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{`${sysvarAccount.info.burnPercent}%`}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Exemption Threshold</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{sysvarAccount.info.exemptionThreshold} years</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Lamports Per Byte Year</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{sysvarAccount.info.lamportsPerByteYear}</BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function SysvarAccountRewardsCard({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarRewardsAccount;
}) {
    const refresh = useRefreshAccount();

    const validatorPointValueFormatted = new Intl.NumberFormat('en-US', {
        maximumSignificantDigits: 20,
    }).format(sysvarAccount.info.validatorPointValue);

    return (
        <AccountCard
            title="Sysvar: Rewards"
            account={account}
            analyticsSection="sysvar_rewards_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Validator Point Value</BaseTable.Cell>
                <BaseTable.Cell className="e-font-mono e-text-right">
                    {validatorPointValueFormatted} lamports
                </BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}
