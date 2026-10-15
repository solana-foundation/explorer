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

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

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
    const rows: KeyValueRow[] = [
        {
            label: (
                <>
                    Slot History <span className="text-dk-gray-700">(previous 100 slots)</span>
                </>
            ),
            value: history.map(val => (
                <p key={val} className="mb-0">
                    <Slot slot={val} link />
                </p>
            )),
            valueClassName: 'font-mono',
        },
    ];
    return (
        <AccountCard
            title="Sysvar: Slot History"
            account={account}
            analyticsSection="sysvar_slot_history_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
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
    const rows: KeyValueRow[] = [
        { label: 'Lamports Per Signature', value: sysvarAccount.info.feeCalculator.lamportsPerSignature },
    ];
    return (
        <AccountCard
            title="Sysvar: Fees"
            account={account}
            analyticsSection="sysvar_fees_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
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
    const rows: KeyValueRow[] = [
        { label: 'Slots Per Epoch', value: sysvarAccount.info.slotsPerEpoch },
        { label: 'Leader Schedule Slot Offset', value: sysvarAccount.info.leaderScheduleSlotOffset },
        { label: 'Epoch Warmup Enabled', value: <code>{sysvarAccount.info.warmup ? 'true' : 'false'}</code> },
        { label: 'First Normal Epoch', value: sysvarAccount.info.firstNormalEpoch },
        { label: 'First Normal Slot', value: <Slot slot={sysvarAccount.info.firstNormalSlot} /> },
    ];
    return (
        <AccountCard
            title="Sysvar: Epoch Schedule"
            account={account}
            analyticsSection="sysvar_epoch_schedule_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

function SysvarAccountClockCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarClockAccount }) {
    const refresh = useRefreshAccount();
    const rows: KeyValueRow[] = [
        {
            label: 'Timestamp',
            value: displayTimestamp(unixTimestampToMs(sysvarAccount.info.unixTimestamp)),
            valueClassName: 'font-mono',
        },
        { label: 'Epoch', value: <Epoch epoch={sysvarAccount.info.epoch} link /> },
        { label: 'Leader Schedule Epoch', value: <Epoch epoch={sysvarAccount.info.leaderScheduleEpoch} link /> },
        { label: 'Slot', value: <Slot slot={sysvarAccount.info.slot} link /> },
    ];
    return (
        <AccountCard
            title="Sysvar: Clock"
            account={account}
            analyticsSection="sysvar_clock_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

function SysvarAccountRentCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarRentAccount }) {
    const refresh = useRefreshAccount();
    const rows: KeyValueRow[] = [
        { label: 'Burn Percent', value: `${sysvarAccount.info.burnPercent}%` },
        { label: 'Exemption Threshold', value: `${sysvarAccount.info.exemptionThreshold} years` },
        { label: 'Lamports Per Byte Year', value: sysvarAccount.info.lamportsPerByteYear },
    ];
    return (
        <AccountCard
            title="Sysvar: Rent"
            account={account}
            analyticsSection="sysvar_rent_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
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

    const rows: KeyValueRow[] = [
        {
            label: 'Validator Point Value',
            value: `${validatorPointValueFormatted} lamports`,
            valueClassName: 'font-mono',
        },
    ];

    return (
        <AccountCard
            title="Sysvar: Rewards"
            account={account}
            analyticsSection="sysvar_rewards_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}
