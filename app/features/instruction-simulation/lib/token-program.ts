import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import type { ParsedAccountData } from '@solana/web3.js';

const TOKEN_PROGRAM_BASE58 = TOKEN_PROGRAM_ID.toBase58();
const TOKEN_2022_PROGRAM_BASE58 = TOKEN_2022_PROGRAM_ID.toBase58();

/** String comparison for RPC responses where owner is a base58 string, not a PublicKey */
export function isTokenProgramBase58(owner: string): boolean {
    return owner === TOKEN_PROGRAM_BASE58 || owner === TOKEN_2022_PROGRAM_BASE58;
}

/** Narrow `ParsedAccountData | Buffer` to `ParsedAccountData` when the RPC returned parsed JSON */
export function toParsedData(data: ParsedAccountData | Buffer): ParsedAccountData | undefined {
    if (typeof data === 'object' && 'parsed' in data) return data;
    return undefined;
}
