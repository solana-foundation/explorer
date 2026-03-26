// Converts raw decoded wire data into labeled, human-readable output
// for display in the UI.

import { AuthorityType } from '@solana-program/token-2022';

import type { AccountEntry, DecodedParams, LabeledAccount, RawDecoded } from './types';

// Account layouts: each SPL Token instruction expects a fixed sequence of named
// accounts, optionally followed by multisig signer accounts.
// See: https://github.com/solana-program/token/blob/main/interface/src/instruction.rs
const ACCOUNT_ROLES: Record<RawDecoded['type'], readonly string[]> = {
    approve: ['Source', 'Delegate', 'Owner'],
    approveChecked: ['Source', 'Mint', 'Delegate', 'Owner'],
    burn: ['Account', 'Mint', 'Owner/Delegate'],
    burnChecked: ['Account', 'Mint', 'Owner/Delegate'],
    closeAccount: ['Account', 'Destination', 'Owner'],
    mintTo: ['Mint', 'Destination', 'Mint Authority'],
    mintToChecked: ['Mint', 'Destination', 'Mint Authority'],
    setAuthority: ['Account', 'Current Authority'],
    transfer: ['Source', 'Destination', 'Owner/Delegate'],
    transferChecked: ['Source', 'Mint', 'Destination', 'Owner/Delegate'],
};

export function formatDecoded(raw: RawDecoded, externalDecimals?: number): DecodedParams {
    return {
        accounts: labelAccounts(raw.accounts, ACCOUNT_ROLES[raw.type]),
        fields: formatFields(raw, externalDecimals),
    };
}

function formatFields(raw: RawDecoded, externalDecimals?: number): { label: string; value: string }[] {
    switch (raw.type) {
        case 'transfer':
        case 'approve':
        case 'mintTo':
        case 'burn':
            return [{ label: 'Amount', value: formatAmount(raw.amount, externalDecimals) }];

        case 'transferChecked':
        case 'approveChecked':
        case 'mintToChecked':
        case 'burnChecked':
            return [
                { label: 'Amount', value: formatTokenAmount(raw.amount, raw.decimals) },
                { label: 'Decimals', value: raw.decimals.toString() },
            ];

        case 'closeAccount':
            return [];

        case 'setAuthority':
            return [
                {
                    label: 'Authority Type',
                    value: AuthorityType[raw.authorityType] ?? `Unknown (${raw.authorityType})`,
                },
                { label: 'New Authority', value: raw.newAuthority ?? '(none)' },
            ];
    }
}

// Format amount using decimals when available, otherwise show raw value.
function formatAmount(amount: bigint, decimals: number | undefined): string {
    if (decimals === undefined) return amount.toString();
    return formatTokenAmount(amount, decimals);
}

// Format a raw token amount using its decimals (e.g. 1500000 with 6 decimals → "1.5").
function formatTokenAmount(amount: bigint, decimals: number): string {
    if (decimals === 0) return amount.toString();

    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const fractional = amount % divisor;

    if (fractional === 0n) return whole.toString();

    // eslint-disable-next-line no-restricted-syntax -- Trimming trailing zeros from a decimal string; a simple replace is clearer than a manual loop
    const fractionalStr = fractional.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fractionalStr}`;
}

// SPL Token instructions support multisig owners/delegates. The `layout` defines the
// named positional accounts; any remaining accounts are additional signers required to
// meet the multisig threshold.
// See: https://github.com/solana-program/token/blob/main/program/src/processor.rs#L988
function labelAccounts(accounts: AccountEntry[], roles: readonly string[]): LabeledAccount[] {
    return accounts.map((account, i) => ({
        ...account,
        label: i < roles.length ? roles[i] : `Signer ${i - roles.length + 1}`,
    }));
}
