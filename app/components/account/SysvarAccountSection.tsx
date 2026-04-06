import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Epoch } from '@components/common/Epoch';
import { Slot } from '@components/common/Slot';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';
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

            <tr>
                <td className="align-top">
                    Slot History <span className="text-muted">(previous 100 slots)</span>
                </td>
                <td className="text-lg-end font-monospace">
                    {history.map(val => (
                        <p key={val} className="mb-0">
                            <Slot slot={val} link />
                        </p>
                    ))}
                </td>
            </tr>
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

            <tr>
                <td>Lamports Per Signature</td>
                <td className="text-lg-end">{sysvarAccount.info.feeCalculator.lamportsPerSignature}</td>
            </tr>
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

            <tr>
                <td>Slots Per Epoch</td>
                <td className="text-lg-end">{sysvarAccount.info.slotsPerEpoch}</td>
            </tr>

            <tr>
                <td>Leader Schedule Slot Offset</td>
                <td className="text-lg-end">{sysvarAccount.info.leaderScheduleSlotOffset}</td>
            </tr>

            <tr>
                <td>Epoch Warmup Enabled</td>
                <td className="text-lg-end">
                    <code>{sysvarAccount.info.warmup ? 'true' : 'false'}</code>
                </td>
            </tr>

            <tr>
                <td>First Normal Epoch</td>
                <td className="text-lg-end">{sysvarAccount.info.firstNormalEpoch}</td>
            </tr>

            <tr>
                <td>First Normal Slot</td>
                <td className="text-lg-end">
                    <Slot slot={sysvarAccount.info.firstNormalSlot} />
                </td>
            </tr>
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

            <tr>
                <td>Timestamp</td>
                <td className="text-lg-end font-monospace">
                    {displayTimestamp(sysvarAccount.info.unixTimestamp * 1000)}
                </td>
            </tr>

            <tr>
                <td>Epoch</td>
                <td className="text-lg-end">
                    <Epoch epoch={sysvarAccount.info.epoch} link />
                </td>
            </tr>

            <tr>
                <td>Leader Schedule Epoch</td>
                <td className="text-lg-end">
                    <Epoch epoch={sysvarAccount.info.leaderScheduleEpoch} link />
                </td>
            </tr>

            <tr>
                <td>Slot</td>
                <td className="text-lg-end">
                    <Slot slot={sysvarAccount.info.slot} link />
                </td>
            </tr>
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

            <tr>
                <td>Burn Percent</td>
                <td className="text-lg-end">{sysvarAccount.info.burnPercent + '%'}</td>
            </tr>

            <tr>
                <td>Exemption Threshold</td>
                <td className="text-lg-end">{sysvarAccount.info.exemptionThreshold} years</td>
            </tr>

            <tr>
                <td>Lamports Per Byte Year</td>
                <td className="text-lg-end">{sysvarAccount.info.lamportsPerByteYear}</td>
            </tr>
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

            <tr>
                <td>Validator Point Value</td>
                <td className="text-lg-end font-monospace">{validatorPointValueFormatted} lamports</td>
            </tr>
        </AccountCard>
    );
}
