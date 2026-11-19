import type { TokenInfo } from './types';

export type TokenInfoLookup =
    { kind: 'listed'; token: TokenInfo } | { kind: 'not-listed' } | { kind: 'rate-limited' } | { kind: 'unavailable' };

export type TokenInfosLookup =
    { kind: 'resolved'; tokens: TokenInfo[] } | { kind: 'rate-limited' } | { kind: 'unavailable' };

export function toTokenInfoLookup(result: TokenInfosLookup, mint: string): TokenInfoLookup {
    if (result.kind !== 'resolved') return result;
    const token = result.tokens.find(entry => entry.address === mint);
    return token ? { kind: 'listed', token } : { kind: 'not-listed' };
}
