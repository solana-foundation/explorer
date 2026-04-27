'use client';

import { selectMintDecimals, selectTokenAccountMint, useAccountQuery } from '@entities/account';
import { type ParsedTokenInstruction, TokenInstruction } from '@solana-program/token';
import { useEffect } from 'react';

import type { MintInfo } from '../lib/types';
import { useBatchMintRegistry } from './batch-mint-registry';

// Resolves mint decimals for a single batch sub-instruction using AccountsProvider.
//
// - Transfer/Approve: 2 hops (token account -> discover mint -> read decimals)
// - MintTo: 1 hop (accounts.mint IS the mint)
// - Burn: 1 hop (accounts.mint IS the mint)
// - Checked variants / others: no lookup needed
//
// When the on-chain lookup fails (e.g. closed token account), falls back to
// the batch-level mint registry if all other sub-instructions resolved to
// the same mint.
export function useSubInstructionMintInfo(parsed: ParsedTokenInstruction<string>): MintInfo | undefined {
    const registry = useBatchMintRegistry();
    const lookup = resolveLookupAddress(parsed);

    // Hop 1: For Transfer/Approve, fetch the token account to discover its mint.
    const tokenAccountQuery = useAccountQuery(lookup?.kind === 'tokenAccount' ? [lookup.address] : undefined, {
        select: selectTokenAccountMint,
    });

    // The mint address is either known directly (MintTo/Burn) or discovered
    // from the token account query (Transfer/Approve).
    const mintAddress = lookup?.kind === 'mint' ? lookup.address : tokenAccountQuery.data;

    // Hop 2 (or only hop): Fetch the mint account to get decimals.
    const mintQuery = useAccountQuery(mintAddress ? [mintAddress] : undefined, {
        select: selectMintDecimals,
    });

    const decimals = mintQuery.data;
    const resolved = decimals !== undefined && mintAddress !== undefined ? { decimals, mint: mintAddress } : undefined;

    // Register discovered mint so other sub-instructions can use it as fallback.
    useEffect(() => {
        if (mintAddress === undefined || decimals === undefined) return;
        registry?.register(mintAddress, decimals);
    }, [mintAddress, decimals, registry]);

    if (resolved) return resolved;

    // Fallback: if this sub-instruction needs decimals but couldn't resolve
    // (e.g. closed token account), use the batch-wide unique mint.
    if (lookup && !resolved) {
        return registry?.getUniqueMint();
    }

    return undefined;
}

type LookupAddress = { kind: 'mint'; address: string } | { kind: 'tokenAccount'; address: string };

function resolveLookupAddress(parsed: ParsedTokenInstruction<string>): LookupAddress | undefined {
    switch (parsed.instructionType) {
        case TokenInstruction.Transfer:
        case TokenInstruction.Approve:
            return { address: parsed.accounts.source.address, kind: 'tokenAccount' };
        case TokenInstruction.CloseAccount:
            return { address: parsed.accounts.account.address, kind: 'tokenAccount' };
        case TokenInstruction.Revoke:
            return { address: parsed.accounts.source.address, kind: 'tokenAccount' };
        case TokenInstruction.MintTo:
            return { address: parsed.accounts.mint.address, kind: 'mint' };
        case TokenInstruction.Burn:
            return { address: parsed.accounts.mint.address, kind: 'mint' };
        default:
            return undefined;
    }
}
