// Fetches mint decimals for batched sub-instructions via RPC.
//
// For Transfer/Approve the source account is a token account — we first fetch
// it to discover the mint, then fetch the mint for decimals (2 batched RPCs).
// For MintTo/Burn the mint is already in the accounts (1 batched RPC).

import { type Connection, PublicKey } from '@solana/web3.js';
import { number, string, type as sType } from 'superstruct';

import type { LookupEntry } from '../lib/collect-lookups';
import type { MintInfo } from '../lib/types';

// Pick the single method we need so tests can pass a lightweight stub.
export type ParsedAccountFetcher = Pick<Connection, 'getMultipleParsedAccounts'>;

export async function fetchDecimals(
    lookups: LookupEntry[],
    connection: ParsedAccountFetcher,
): Promise<Map<number, MintInfo>> {
    if (lookups.length === 0) return new Map();

    const parsed = await fetchWithHops(
        lookups.map(l => (l.kind === 'mint' ? l.mintAddress : l.tokenAccountAddress)),
        connection,
    );

    const result = new Map<number, MintInfo>();
    for (const lookup of lookups) {
        const info = resolveMintInfo(lookup, parsed);
        if (info) result.set(lookup.subIndex, info);
    }
    return result;
}

// ── Helpers ──────────────────────────────────────────────────────────

function resolveMintInfo(lookup: LookupEntry, parsed: Map<string, ParsedData>): MintInfo | undefined {
    if (lookup.kind === 'mint') {
        const decimals = extractDecimals(parsed.get(lookup.mintAddress));
        if (decimals === undefined) return undefined;
        return { decimals, mint: lookup.mintAddress };
    }
    const mint = extractMintAddress(parsed.get(lookup.tokenAccountAddress));
    if (!mint) return undefined;
    const decimals = extractDecimals(parsed.get(mint));
    if (decimals === undefined) return undefined;
    return { decimals, mint };
}

// Fetches all addresses, then automatically fetches any mints discovered
// from token accounts that weren't in the initial batch (the two-hop case).
async function fetchWithHops(addresses: string[], connection: ParsedAccountFetcher): Promise<Map<string, ParsedData>> {
    const parsed = await fetchParsedAccounts(addresses, connection);

    const missingMints = new Set<string>();
    for (const data of parsed.values()) {
        const mint = extractMintAddress(data);
        if (mint && !parsed.has(mint)) missingMints.add(mint);
    }

    if (missingMints.size > 0) {
        const fetched = await fetchParsedAccounts([...missingMints], connection);
        for (const [addr, data] of fetched) {
            parsed.set(addr, data);
        }
    }

    return parsed;
}

type MintParsedData = { info: { decimals: number } };
type TokenAccountParsedData = { info: { mint: string } };
type ParsedData = MintParsedData | TokenAccountParsedData;

// Minimal superstruct schemas for the `parsed` object returned by
// `getMultipleParsedAccounts`. We only validate the fields we need
// rather than reusing the full validators from @validators/accounts/token,
// which carry many fields irrelevant to decimal resolution.
// sType (not object) — RPC info objects contain many extra fields we don't need
const MintParsed = sType({ info: sType({ decimals: number() }) });
function extractDecimals(data: ParsedData | undefined): number | undefined {
    if (MintParsed.is(data)) return data.info.decimals;
    return undefined;
}

const TokenAccountParsed = sType({ info: sType({ mint: string() }) });
function extractMintAddress(data: ParsedData | undefined): string | undefined {
    if (TokenAccountParsed.is(data)) return data.info.mint;
    return undefined;
}

const MintData = sType({ parsed: MintParsed });
const TokenAccountData = sType({ parsed: TokenAccountParsed });
async function fetchParsedAccounts(
    addresses: string[],
    connection: ParsedAccountFetcher,
): Promise<Map<string, ParsedData>> {
    const unique = [...new Set(addresses)];
    const { value } = await connection.getMultipleParsedAccounts(unique.map(a => new PublicKey(a)));

    const result = new Map<string, ParsedData>();
    value.forEach((info, i) => {
        if (!info) return;
        const { data } = info;
        if (MintData.is(data)) {
            result.set(unique[i], data.parsed);
        } else if (TokenAccountData.is(data)) {
            result.set(unique[i], data.parsed);
        }
    });
    return result;
}
