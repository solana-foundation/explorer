import { fetchTokenInfosFromApi, getChainId } from '@entities/token-info';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { TokenExtension } from '@validators/accounts/token-extension';

import { accountRefreshKey } from '@/app/shared/lib/account-refresh-key';

export type FullTokenInfo = {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
};

export function isRedactedTokenAddress(address: string): boolean {
    return (
        process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false
    );
}

export type FullTokenInfoSwrKey = ReturnType<typeof getFullTokenInfoSwrKey>;

export function getFullTokenInfoSwrKey(address: string, cluster: Cluster, url: string, genesisHash?: string) {
    return accountRefreshKey(url, address, 'full-token-info', cluster, genesisHash);
}

export async function fetchFullTokenInfo([_prefix, _url, pubkey, _kind, cluster, genesisHash]: FullTokenInfoSwrKey) {
    return await getFullTokenInfo(new PublicKey(pubkey), cluster, genesisHash);
}

export async function getFullTokenInfo(
    address: PublicKey,
    cluster: Cluster,
    genesisHash?: string,
): Promise<FullTokenInfo | undefined> {
    if (isRedactedTokenAddress(address.toBase58())) {
        return undefined;
    }
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return undefined;

    const sdkTokenInfos = await fetchTokenInfosFromApi({
        addresses: [address.toBase58()],
        cluster,
        genesisHash,
        includeOnChainFallback: false,
    });
    const sdkTokenInfo = sdkTokenInfos?.[0];

    if (!sdkTokenInfo) {
        // A failed request throws, so a caller cannot read it as a mint without token info.
        if (sdkTokenInfos === undefined) throw new Error('[utils:token-info] Token info request failed');
        return undefined;
    }
    return {
        address: sdkTokenInfo.address,
        chainId,
        decimals: sdkTokenInfo.decimals ?? 0,
        logoURI: sdkTokenInfo.logoURI ?? undefined,
        name: sdkTokenInfo.name,
        symbol: sdkTokenInfo.symbol,
    };
}

export function getCurrentTokenScaledUiAmountMultiplier(extensions: Array<TokenExtension> | undefined): string {
    const scaledUiAmountConfig = extensions?.find(extension => extension.extension === 'scaledUiAmountConfig');
    if (!scaledUiAmountConfig) {
        return '1';
    }
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return currentTimestamp >= scaledUiAmountConfig.state.newMultiplierEffectiveTimestamp
        ? scaledUiAmountConfig.state.newMultiplier
        : scaledUiAmountConfig.state.multiplier;
}
