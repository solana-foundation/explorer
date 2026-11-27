import type { TokenInfo } from './types';

export function orderMintsByVerification(
    mints: readonly string[],
    tokenInfos: ReadonlyMap<string, TokenInfo>,
): string[] {
    const isVerified = (mint: string): boolean => tokenInfos.get(mint)?.verified === true;
    return [...mints.filter(isVerified), ...mints.filter(mint => !isVerified(mint))];
}
