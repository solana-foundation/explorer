import 'client-only';

import type { Account } from '@providers/accounts';
import type { PublicKey } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import type { SquadsAccountType } from './SquadsAccountSection';

export type SquadsMultisigAddresses = { multisig: PublicKey; vault: PublicKey };

export function useSquadsMultisigAddresses(
    account: Account,
    accountType: SquadsAccountType,
): SquadsMultisigAddresses | undefined {
    const rawData = account.data.raw;
    const { data } = useSWRImmutable(
        rawData && (['squads-multisig-addresses', account.pubkey.toBase58(), accountType, rawData] as const),
        ([, , type, bytes]: readonly [string, string, SquadsAccountType, Uint8Array]) => {
            return decodeMultisigAddresses(type, bytes);
        },
        {
            onError: error =>
                Logger.error(new Error('[squads] Failed to decode Squads multisig addresses', { cause: error })),
            shouldRetryOnError: false,
        },
    );
    return data;
}

async function decodeMultisigAddresses(
    accountType: SquadsAccountType,
    rawData: Uint8Array,
): Promise<SquadsMultisigAddresses> {
    const { generated, getVaultPda } = await import('@sqds/multisig');
    const data = Buffer.from(rawData);
    const { multisig, vaultIndex } =
        accountType === 'batch'
            ? generated.Batch.deserialize(data)[0]
            : generated.VaultTransaction.deserialize(data)[0];
    const [vault] = getVaultPda({ index: vaultIndex, multisigPda: multisig });
    return { multisig, vault };
}
