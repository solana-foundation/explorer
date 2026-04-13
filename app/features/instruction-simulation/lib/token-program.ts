import type { ParsedAccountData } from '@solana/web3.js';

/** Narrow `ParsedAccountData | Buffer` to `ParsedAccountData` when the RPC returned parsed JSON */
export function toParsedData(data: ParsedAccountData | Buffer): ParsedAccountData | undefined {
    if (typeof data === 'object' && 'parsed' in data) return data;
    return undefined;
}
