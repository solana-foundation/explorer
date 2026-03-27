// Converts raw decoded wire data into labeled, human-readable output
// for display in the UI.

import { formatTokenAmount } from '@entities/token-amount';
import { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@solana-program/token-2022';

import type { AccountEntry, DecodedParams, LabeledAccount, MintInfo, RawDecoded } from './types';

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

// Unchecked Transfer and Approve don't include the mint in their on-chain
// account list. When the mint address has been resolved via RPC, we inject
// a synthetic "Mint" account so the UI matches TransferChecked's layout.
const MINT_INJECT_TYPES = new Set<RawDecoded['type']>(['transfer', 'approve']);

export function formatDecoded(raw: RawDecoded, mintInfo?: MintInfo): DecodedParams {
    const accounts = labelAccounts(raw.accounts, ACCOUNT_ROLES[raw.type]);

    if (mintInfo?.mint && MINT_INJECT_TYPES.has(raw.type)) {
        // Insert Mint right after Source (index 0), mirroring TransferChecked layout.
        accounts.splice(1, 0, {
            isSigner: false,
            isWritable: false,
            label: 'Mint',
            pubkey: new PublicKey(mintInfo.mint),
        });
    }

    return {
        accounts,
        fields: formatFields(raw, mintInfo?.decimals),
    };
}

function formatFields(raw: RawDecoded, externalDecimals?: number): { label: string; value: string }[] {
    switch (raw.type) {
        case 'transfer':
        case 'approve':
        case 'mintTo':
        case 'burn':
            return [
                {
                    label: 'Amount',
                    value:
                        externalDecimals === undefined
                            ? raw.amount.toString()
                            : formatTokenAmount({ amount: raw.amount, decimals: externalDecimals }),
                },
            ];

        case 'transferChecked':
        case 'approveChecked':
        case 'mintToChecked':
        case 'burnChecked':
            return [
                { label: 'Decimals', value: raw.decimals.toString() },
                { label: 'Amount', value: formatTokenAmount({ amount: raw.amount, decimals: raw.decimals }) },
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
