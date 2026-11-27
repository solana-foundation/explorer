import 'client-only';

import { type ChainId, type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { useCluster } from '@providers/cluster';
import { accountRefreshKey } from '@shared/lib/account-refresh-key';
import { Cluster } from '@utils/cluster';
import { useEffect, useMemo, useState } from 'react';
import { unstable_serialize } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { lookupTokenInfo, lookupVerifiedTokenInfos } from '../api/lookup-token-info';
import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
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
    const { kind, tokenInfos } = useTokenInfos({ cluster, genesisHash, mints });
    const tokenInfo = mint ? tokenInfos.get(mint) : undefined;

    if (kind === 'idle') return { isLoading: false, kind: 'idle', tokenInfo: undefined };
    if (kind === 'loading') return { isLoading: true, kind: 'loading', tokenInfo: undefined };
    if (tokenInfo) return { isLoading: false, kind: 'listed', tokenInfo };
    return { isLoading: false, kind: kind === 'resolved' ? 'not-listed' : kind, tokenInfo: undefined };
}

type UseTokenInfosResult = { kind: TokenInfosKind; tokenInfos: ReadonlyMap<string, TokenInfo> };

type TokenInfosKind = 'idle' | 'loading' | 'resolved' | LookupFailureKind;

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
    const { url } = useCluster();
    const chainId = getChainId(cluster, genesisHash);
    const key = useMemo(
        () =>
            chainId && mints.length > 0
                ? getTokenInfosSwrKey({ chainId, cluster, includeOnChainFallback, mints, url })
                : undefined,
        [chainId, cluster, includeOnChainFallback, mints, url],
    );

    const { data, error, isLoading } = useSWRImmutable<TokenInfo[], unknown>(
        key,
        () => fetchListedTokenInfos({ cluster, genesisHash, includeOnChainFallback, mints }),
        { shouldRetryOnError: false },
    );
    const tokenInfos = useMemo(() => toTokenInfoMap(data), [data]);

    return { kind: key === undefined ? 'idle' : toTokenInfosKind({ data, error, isLoading }), tokenInfos };
}

export function getTokenInfosSwrKey({
    chainId,
    cluster,
    includeOnChainFallback = false,
    mints,
    url,
}: {
    chainId: ChainId;
    cluster: Cluster;
    includeOnChainFallback?: boolean;
    mints: readonly string[];
    url: string;
}): readonly ['account-refresh', string, string, 'token-infos', Cluster, ChainId, boolean] {
    // The on-chain fallback skips a custom cluster, so the key needs the cluster and the chain id.
    return accountRefreshKey(url, mints.join(','), 'token-infos', cluster, chainId, includeOnChainFallback);
}

export function useVerifiedTokenInfos({
    cluster,
    genesisHash,
    mints,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    mints: readonly string[];
}): { isLoading: boolean; tokenInfos: ReadonlyMap<string, TokenInfo> } {
    const chainId = getChainId(cluster, genesisHash);
    const key = useMemo(
        () =>
            chainId && jupiterListsTokensOn(chainId) && mints.length > 0
                ? getVerifiedTokenInfosSwrKey(mints)
                : undefined,
        [chainId, mints],
    );

    const { data, error, isLoading } = useSWRImmutable<TokenInfo[], unknown>(
        key,
        () => fetchVerifiedTokenInfos(mints),
        { shouldRetryOnError: false },
    );
    const tokenInfos = useMemo(() => toTokenInfoMap(data), [data]);

    const serializedKey = unstable_serialize(key);
    const [committedKey, setCommittedKey] = useState<string>();
    useEffect(() => setCommittedKey(serializedKey), [serializedKey]);
    const isStaleFailure = committedKey !== serializedKey && data === undefined && error !== undefined;

    return { isLoading: isLoading || isStaleFailure, tokenInfos };
}

export function getVerifiedTokenInfosSwrKey(mints: readonly string[]): readonly ['verified-token-infos', string] {
    return ['verified-token-infos', mints.join(',')];
}

function toTokenInfosKind({
    data,
    error,
    isLoading,
}: {
    data: TokenInfo[] | undefined;
    error: unknown;
    isLoading: boolean;
}): Exclude<TokenInfosKind, 'idle'> {
    if (data !== undefined) return 'resolved';
    if (error !== undefined) return toFailureKind(error);
    return isLoading ? 'loading' : 'resolved';
}

function toFailureKind(error: unknown): LookupFailureKind {
    return error instanceof TokenInfosLookupError ? error.kind : 'unavailable';
}

function toTokenInfoMap(tokens: TokenInfo[] | undefined): ReadonlyMap<string, TokenInfo> {
    return tokens ? new Map(tokens.map(token => [token.address, token])) : NO_TOKEN_INFOS;
}

const NO_TOKEN_INFOS: ReadonlyMap<string, TokenInfo> = new Map();

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

async function fetchVerifiedTokenInfos(mints: readonly string[]): Promise<TokenInfo[]> {
    const lookup = await lookupVerifiedTokenInfos({ addresses: mints });
    if (lookup.kind !== 'resolved') throw new TokenInfosLookupError(lookup.kind);
    return lookup.tokens;
}

class TokenInfosLookupError extends Error {
    constructor(readonly kind: LookupFailureKind) {
        super('[token-info] A token info lookup failed');
    }
}
