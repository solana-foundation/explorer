import { ChainId } from '@entities/chain-id';
import { fetchTokenInfosFromApi, getChainId } from '@entities/token-info';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { TokenExtension } from '@validators/accounts/token-extension';

import { accountRefreshKey } from '@/app/shared/lib/account-refresh-key';
import { Logger } from '@/app/shared/lib/logger';

type TokenExtensions = {
    readonly website?: string;
    readonly bridgeContract?: string;
    readonly assetContract?: string;
    readonly address?: string;
    readonly explorer?: string;
    readonly twitter?: string;
    readonly github?: string;
    readonly medium?: string;
    readonly tgann?: string;
    readonly tggroup?: string;
    readonly discord?: string;
    readonly serumV3Usdt?: string;
    readonly serumV3Usdc?: string;
    readonly coingeckoId?: string;
    readonly imageUrl?: string;
    readonly description?: string;
};
export type FullTokenInfo = {
    readonly chainId: number;
    readonly address: string;
    readonly name: string;
    readonly decimals: number;
    readonly symbol: string;
    readonly logoURI?: string;
    readonly extensions?: TokenExtensions;
};

type FullLegacyTokenInfoList = {
    tokens: FullTokenInfo[];
};

async function getFullLegacyTokenInfoUsingCdn(
    address: PublicKey,
    chainId: ChainId,
): Promise<FullTokenInfo | undefined> {
    const tokenListResponse = await fetch(
        'https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json',
    );
    if (tokenListResponse.status >= 400) {
        Logger.error(new Error('[utils:token-info] Error fetching token list from CDN'));
        return undefined;
    }
    const { tokens } = (await tokenListResponse.json()) as FullLegacyTokenInfoList;
    const tokenInfo = tokens.find(t => t.address === address.toString() && t.chainId === chainId);
    return tokenInfo;
}

export function isRedactedTokenAddress(address: string): boolean {
    return (
        process.env.NEXT_PUBLIC_BAD_TOKENS?.split(',')
            .map(addr => addr.trim())
            .includes(address) ?? false
    );
}

/**
 * Get the full token info from a CDN with the legacy token list
 * The token info API only returns the most common fields, we sometimes need eg extensions
 * @param address Public key of the token
 * @param cluster Cluster to fetch the token info for
 * @param genesisHash Genesis hash for cluster identification (required for the Custom cluster)
 */
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

    const [legacyCdnTokenInfo, sdkTokenInfos] = await Promise.all([
        getFullLegacyTokenInfoUsingCdn(address, chainId),
        fetchTokenInfosFromApi({
            addresses: [address.toBase58()],
            cluster,
            genesisHash,
            includeOnChainFallback: false,
        }),
    ]);
    const sdkTokenInfo = sdkTokenInfos?.[0];

    if (!sdkTokenInfo) {
        if (legacyCdnTokenInfo) return legacyCdnTokenInfo;
        // A failed request throws, so a caller cannot read it as a mint without token info.
        if (sdkTokenInfos === undefined) throw new Error('[utils:token-info] Token info request failed');
        return undefined;
    }
    return {
        address: sdkTokenInfo.address,
        chainId,
        decimals: sdkTokenInfo.decimals ?? 0,
        extensions: legacyCdnTokenInfo?.extensions,
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
