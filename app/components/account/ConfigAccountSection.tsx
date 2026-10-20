import { AccountAddressRow, AccountBalanceRow } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { ConfigAccount, StakeConfigInfoAccount, ValidatorInfoAccount } from '@validators/accounts/config';
import React from 'react';

import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { type KeyValueRow, type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';

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

    const rows: KeyValueRow[] = [
        { label: 'Warmup / Cooldown Rate', value: warmupCooldownFormatted },
        { label: 'Slash Penalty', value: slashPenaltyFormatted },
    ];

    return (
        <AccountCard
            title="Stake Config"
            account={account}
            analyticsSection="stake_config_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

function ValidatorInfoCard({ account, configAccount }: { account: Account; configAccount: ValidatorInfoAccount }) {
    const refresh = useRefreshAccount();

    const rows: KeyValueRowInput[] = [
        configAccount.info.configData.name && {
            label: 'Name',
            value: configAccount.info.configData.name,
        },
        configAccount.info.configData.keybaseUsername && {
            label: 'Keybase Username',
            value: configAccount.info.configData.keybaseUsername,
        },
        configAccount.info.configData.website && {
            label: 'Website',
            value: (
                <ExternalLink href={configAccount.info.configData.website}>
                    {configAccount.info.configData.website}
                </ExternalLink>
            ),
        },
        configAccount.info.configData.details && {
            label: 'Details',
            value: configAccount.info.configData.details,
        },
        configAccount.info.keys &&
            configAccount.info.keys.length > 1 && {
                label: 'Signer',
                value: <Address pubkey={new PublicKey(configAccount.info.keys[1].pubkey)} link />,
            },
    ];

    return (
        <AccountCard
            title="Validator Info"
            account={account}
            analyticsSection="validator_info_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AccountAddressRow account={account} />
            <AccountBalanceRow account={account} />
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}
