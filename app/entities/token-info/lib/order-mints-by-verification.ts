import type { TokenInfo } from './types';

export function orderMintsByVerification(
    mints: readonly string[],
    tokenInfos: ReadonlyMap<string, TokenInfo>,
): string[] {
    const verified: string[] = [];
    const listed: string[] = [];
    const unlisted: string[] = [];

    for (const mint of mints) {
        const info = tokenInfos.get(mint);
        if (!info) {
            unlisted.push(mint);
        } else if (info.verified) {
            verified.push(mint);
        } else {
            listed.push(mint);
        }
    }

    return [...verified, ...listed, ...unlisted];
}
