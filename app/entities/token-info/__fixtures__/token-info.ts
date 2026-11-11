import type { TokenInfo } from '../lib/types';

export function tokenInfo(address: string, verified = false): TokenInfo {
    return { address, decimals: 6, logoURI: null, name: address, symbol: address, verified };
}
