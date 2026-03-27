'use client';

import { selectMintDecimals, selectTokenAccountMint, useAccountQuery } from '@entities/account';
import type { AccountMeta } from '@solana/web3.js';

import type { TokenInstructionName } from '../lib/const';
import type { MintInfo } from '../lib/types';

// Resolves mint decimals for a single batch sub-instruction using AccountsProvider.
//
// - Transfer/Approve: 2 hops (token account → discover mint → read decimals)
// - MintTo: 1 hop (accounts[0] IS the mint)
// - Burn: 1 hop (accounts[1] IS the mint)
// - Checked variants / others: no lookup needed
export function useSubInstructionMintInfo(
    typeName: TokenInstructionName | 'Unknown',
    accounts: AccountMeta[],
): MintInfo | undefined {
    const lookup = resolveLookupAddress(typeName, accounts);

    // Hop 1: For Transfer/Approve, fetch the token account to discover its mint.
    const tokenAccountQuery = useAccountQuery(
        lookup?.kind === 'tokenAccount' ? [lookup.address] : undefined,
        { select: selectTokenAccountMint },
    );

    // The mint address is either known directly (MintTo/Burn) or discovered
    // from the token account query (Transfer/Approve).
    const mintAddress = lookup?.kind === 'mint' ? lookup.address : tokenAccountQuery.data;

    // Hop 2 (or only hop): Fetch the mint account to get decimals.
    const mintQuery = useAccountQuery(mintAddress ? [mintAddress] : undefined, {
        select: selectMintDecimals,
    });

    if (mintQuery.data === undefined || mintAddress === undefined) return undefined;
    return { decimals: mintQuery.data, mint: mintAddress };
}

type LookupAddress =
    | { kind: 'mint'; address: string }
    | { kind: 'tokenAccount'; address: string };

function resolveLookupAddress(
    typeName: TokenInstructionName | 'Unknown',
    accounts: AccountMeta[],
): LookupAddress | undefined {
    switch (typeName) {
        case 'Transfer':
        case 'Approve':
            return accounts[0] ? { address: accounts[0].pubkey.toBase58(), kind: 'tokenAccount' } : undefined;
        case 'MintTo':
            return accounts[0] ? { address: accounts[0].pubkey.toBase58(), kind: 'mint' } : undefined;
        case 'Burn':
            return accounts[1] ? { address: accounts[1].pubkey.toBase58(), kind: 'mint' } : undefined;
        default:
            return undefined;
    }
}
