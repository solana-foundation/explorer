import type { TokenInfosLookup } from '../lib/token-info-lookup';
import type { TokenInfo } from '../lib/types';

export function tokenInfo(address: string, verified = false): TokenInfo {
    return { address, decimals: 6, name: address, symbol: address, verified };
}

export function redactedTokenInfo(address: string, verified = false): TokenInfo {
    return { address, decimals: 6, verified };
}

export function resolved(...tokens: TokenInfo[]): TokenInfosLookup {
    return { kind: 'resolved', tokens };
}
