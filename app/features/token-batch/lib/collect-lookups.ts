// Determines which batched sub-instructions need an RPC call to resolve mint
// decimals, and which account to start fetching from.
//
// "Checked" variants (TransferChecked, ApproveChecked, …) carry decimals in
// the instruction data — no lookup needed. "Unchecked" variants (Transfer,
// Approve, MintTo, Burn) only carry a raw amount, so we need the mint account.
//
// The lookup kind and hop count depend on the instruction type:
//
//   Type              Address        Kind            Hops
//   Transfer/Approve  accounts[0]    tokenAccount    2 (source → mint → decimals)
//   MintTo            accounts[0]    mint            1 (mint → decimals)
//   Burn              accounts[1]    mint            1 (mint → decimals)
//
// Everything else (CloseAccount, SetAuthority, Checked variants, Unknown)
// produces no entry — no decimal resolution needed.

import { PublicKey } from '@solana/web3.js';

import type { ParsedSubInstruction } from './batch-parser';
import type { TokenInstructionName } from './const';

type AccountEntry = { pubkey: PublicKey; isSigner: boolean; isWritable: boolean };

export type LookupEntry =
    | { subIndex: number; kind: 'mint'; mintAddress: string }
    | { subIndex: number; kind: 'tokenAccount'; tokenAccountAddress: string };

export function collectLookups(subInstructions: ParsedSubInstruction[]): LookupEntry[] {
    const entries: LookupEntry[] = [];
    for (const sub of subInstructions) {
        const entry = buildLookupEntry(sub.typeName, sub.accounts, sub.index);
        if (entry) entries.push(entry);
    }
    return entries;
}

// Only the four "unchecked" amount instructions need an on-chain lookup.
// Their Checked counterparts (TransferChecked, ApproveChecked, MintToChecked,
// BurnChecked) already carry decimals in the instruction data, so the amount
// can be formatted without any RPC call. The unchecked variants omit decimals,
// so we need to resolve them from the mint account on-chain.
//
// Returns a tagged LookupEntry, or undefined when no lookup is needed
// (Checked variants, SetAuthority, CloseAccount, etc.).
function buildLookupEntry(
    typeName: TokenInstructionName | 'Unknown',
    accounts: AccountEntry[],
    subIndex: number,
): LookupEntry | undefined {
    switch (typeName) {
        // Transfer/Approve don't include the mint in their accounts — the
        // first account is the source token account, which we fetch to
        // discover its mint (requires a second hop).
        case 'Transfer':
        case 'Approve': {
            const address = accounts[0]?.pubkey.toBase58();
            return address ? { kind: 'tokenAccount', subIndex, tokenAccountAddress: address } : undefined;
        }
        // MintTo's first account IS the mint — one hop.
        case 'MintTo': {
            const address = accounts[0]?.pubkey.toBase58();
            return address ? { kind: 'mint', mintAddress: address, subIndex } : undefined;
        }
        // Burn's second account IS the mint — one hop.
        case 'Burn': {
            const address = accounts[1]?.pubkey.toBase58();
            return address ? { kind: 'mint', mintAddress: address, subIndex } : undefined;
        }
        default:
            return undefined;
    }
}
