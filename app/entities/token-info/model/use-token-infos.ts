import 'client-only';

import { type ChainId, type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { Cluster } from '@utils/cluster';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { lookupTokenInfo } from '../api/lookup-token-info';
import type { TokenInfoLookup } from '../lib/token-info-lookup';
import type { TokenInfo } from '../lib/types';

type UseTokenInfoResult =
    | { isLoading: false; kind: 'idle'; tokenInfo: undefined }
    | { isLoading: true; kind: 'loading'; tokenInfo: undefined }
    | { isLoading: false; kind: 'listed'; tokenInfo: TokenInfo }
    | { isLoading: false; kind: 'not-listed' | LookupFailureKind; tokenInfo: undefined };

export function useTokenInfo({
    cluster,
    genesisHash,
    mint,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    mint: string | undefined;
}): UseTokenInfoResult {
    const mints = useMemo(() => (mint ? [mint] : []), [mint]);
    const { failureKind, isIdle, isLoading, tokenInfos } = useTokenInfos({ cluster, genesisHash, mints });
    const tokenInfo = mint ? tokenInfos.get(mint) : undefined;

    if (isIdle) return { isLoading: false, kind: 'idle', tokenInfo: undefined };
    if (isLoading) return { isLoading: true, kind: 'loading', tokenInfo: undefined };
    if (tokenInfo) return { isLoading: false, kind: 'listed', tokenInfo };
    return { isLoading: false, kind: failureKind ?? 'not-listed', tokenInfo: undefined };
}

type UseTokenInfosResult = {
    failureKind: LookupFailureKind | undefined;
    isIdle: boolean;
    isLoading: boolean;
    tokenInfos: ReadonlyMap<string, TokenInfo>;
};

type LookupFailureKind = Exclude<TokenInfoLookup['kind'], 'listed' | 'not-listed'>;

export function useTokenInfos({
    cluster,
    genesisHash,
    includeOnChainFallback = false,
    mints,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    includeOnChainFallback?: boolean;
    mints: readonly string[];
}): UseTokenInfosResult {
    const chainId = getChainId(cluster, genesisHash);
    const key = useMemo(
        () =>
            chainId && mints.length > 0
                ? getTokenInfosSwrKey({ chainId, cluster, includeOnChainFallback, mints })
                : undefined,
        [chainId, cluster, includeOnChainFallback, mints],
    );

    const { data, error, isLoading } = useSWRImmutable<TokenInfo[], unknown>(
        key,
        () => fetchListedTokenInfos({ cluster, genesisHash, includeOnChainFallback, mints }),
        { shouldRetryOnError: false },
    );
    const tokenInfos = useMemo(() => toTokenInfoMap(data), [data]);

    return {
        failureKind: data === undefined && error !== undefined ? toFailureKind(error) : undefined,
        isIdle: key === undefined,
        isLoading: isLoading && error === undefined,
        tokenInfos,
    };
}

function toTokenInfoMap(tokens: TokenInfo[] | undefined): ReadonlyMap<string, TokenInfo> {
    return tokens ? new Map(tokens.map(token => [token.address, token])) : NO_TOKEN_INFOS;
}

const NO_TOKEN_INFOS: ReadonlyMap<string, TokenInfo> = new Map();

function toFailureKind(error: unknown): LookupFailureKind {
    return error instanceof TokenInfosLookupError ? error.kind : 'unavailable';
}

export function getTokenInfosSwrKey({
    chainId,
    cluster,
    includeOnChainFallback = false,
    mints,
}: {
    chainId: ChainId;
    cluster: Cluster;
    includeOnChainFallback?: boolean;
    mints: readonly string[];
}): readonly ['token-infos', string, Cluster, ChainId, boolean] {
    // The on-chain fallback skips a custom cluster, so the key needs the cluster and the chain id.
    return ['token-infos', mints.join(','), cluster, chainId, includeOnChainFallback];
}

export function isTokenInfoSwrKey(key: unknown, mint: string): boolean {
    return Array.isArray(key) && key[0] === 'token-infos' && key[1] === mint;
}

async function fetchListedTokenInfos({
    cluster,
    genesisHash,
    includeOnChainFallback,
    mints,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    includeOnChainFallback: boolean;
    mints: readonly string[];
}): Promise<TokenInfo[]> {
    const lookups = await Promise.all(
        mints.map(mint => lookupTokenInfo({ cluster, genesisHash, includeOnChainFallback, mint })),
    );
    if (!lookups.every(isSettled)) {
        const rateLimited = lookups.some(lookup => lookup.kind === 'rate-limited');
        throw new TokenInfosLookupError(rateLimited ? 'rate-limited' : 'unavailable');
    }
    return lookups.flatMap(lookup => (lookup.kind === 'listed' ? [lookup.token] : []));
}

function isSettled(lookup: TokenInfoLookup): boolean {
    return lookup.kind === 'listed' || lookup.kind === 'not-listed';
}

class TokenInfosLookupError extends Error {
    constructor(readonly kind: LookupFailureKind) {
        super('[token-info] A token info lookup failed');
    }
}
