import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { ConfigAccount, StakeConfigInfoAccount, ValidatorInfoAccount } from '@validators/accounts/config';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

const MAX_SLASH_PENALTY = Math.pow(2, 8);

export function ConfigAccountSection({ account, configAccount }: { account: Account; configAccount: ConfigAccount }) {
    switch (configAccount.type) {
        case 'stakeConfig':
            return <StakeConfigCard account={account} configAccount={configAccount} />;
        case 'validatorInfo':
            return <ValidatorInfoCard account={account} configAccount={configAccount} />;
    }
}

function StakeConfigCard({ account, configAccount }: { account: Account; configAccount: StakeConfigInfoAccount }) {
    const refresh = useRefreshAccount();

    const warmupCooldownFormatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        style: 'percent',
    }).format(configAccount.info.warmupCooldownRate);

    const slashPenaltyFormatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        style: 'percent',
    }).format(configAccount.info.slashPenalty / MAX_SLASH_PENALTY);

    return (
        <AccountCard
            title="Stake Config"
            account={account}
            analyticsSection="stake_config_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            <BaseTable.Row>
                <BaseTable.Cell>Warmup / Cooldown Rate</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{warmupCooldownFormatted}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Slash Penalty</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{slashPenaltyFormatted}</BaseTable.Cell>
            </BaseTable.Row>
        </AccountCard>
    );
}

function ValidatorInfoCard({ account, configAccount }: { account: Account; configAccount: ValidatorInfoAccount }) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Validator Info"
            account={account}
            analyticsSection="validator_info_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />

            {configAccount.info.configData.name && (
                <BaseTable.Row>
                    <BaseTable.Cell>Name</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{configAccount.info.configData.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            {configAccount.info.configData.keybaseUsername && (
                <BaseTable.Row>
                    <BaseTable.Cell>Keybase Username</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {configAccount.info.configData.keybaseUsername}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {configAccount.info.configData.website && (
                <BaseTable.Row>
                    <BaseTable.Cell>Website</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <a href={configAccount.info.configData.website} target="_blank" rel="noopener noreferrer">
                            {configAccount.info.configData.website}
                        </a>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {configAccount.info.configData.details && (
                <BaseTable.Row>
                    <BaseTable.Cell>Details</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{configAccount.info.configData.details}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            {configAccount.info.keys && configAccount.info.keys.length > 1 && (
                <BaseTable.Row>
                    <BaseTable.Cell>Signer</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={new PublicKey(configAccount.info.keys[1].pubkey)} link alignRight />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
        </AccountCard>
    );
}
