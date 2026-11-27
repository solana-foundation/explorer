import 'server-only';

import { type ChainId, type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { Logger } from '@shared/lib/logger';
import { isAddress } from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';
import { unstable_cache } from 'next/cache';

import { reportJupiterError } from '../lib/errors';
import { isRedactedTokenAddress } from '../lib/is-redacted-token-address';
import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { type JupiterToken } from '../lib/jupiter-token';
import { type TokenInfoLookup, type TokenInfosLookup, toTokenInfoLookup } from '../lib/token-info-lookup';
import { type TokenInfo } from '../lib/types';
import { fetchJupiterVerifiedTokens, type JupiterTokensResult, searchJupiterTokens } from './fetch-jupiter-tokens';
import { getTokenInfosFromMetaplex } from './fetch-token-metaplex';

export async function lookupTokenInfo({
    cluster,
    genesisHash,
    mint,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    mint: string;
}): Promise<TokenInfoLookup> {
    if (!isAddress(mint)) return { kind: 'not-listed' };
    return toTokenInfoLookup(await lookupTokenInfos({ addresses: [mint], cluster, genesisHash }), mint);
}

export async function lookupTokenInfos({
    addresses,
    cluster,
    genesisHash,
    includeOnChainFallback = false,
}: {
    addresses: string[];
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    includeOnChainFallback?: boolean;
}): Promise<TokenInfosLookup> {
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return { kind: 'resolved', tokens: [] };

    const result = await getJupiterTokenInfos(addresses, chainId);
    if (result.kind !== 'resolved') {
        reportFailure(result, { addressCount: addresses.length, chainId, cluster });
        return { kind: result.kind };
    }

    if (!includeOnChainFallback) return { kind: 'resolved', tokens: result.tokens };
    return { kind: 'resolved', tokens: await addMetaplexTokenInfos({ addresses, cluster, tokens: result.tokens }) };
}

export async function lookupVerifiedTokenInfos({
    addresses,
}: {
    addresses: readonly string[];
}): Promise<TokenInfosLookup> {
    const result = await getVerifiedTokenInfos();
    if (result.kind !== 'resolved') return result;
    const requested = new Set(addresses);
    const tokens = result.tokens.filter(token => requested.has(token.address)).map(redactTokenInfo);
    return { kind: 'resolved', tokens };
}

async function getVerifiedTokenInfos(): Promise<TokenInfosLookup> {
    try {
        return { kind: 'resolved', tokens: await getCachedVerifiedTokenInfos() };
    } catch (error) {
        if (error instanceof JupiterFailureError) return { kind: error.failure.kind };
        reportFailure({ error, kind: 'unavailable' }, VERIFIED_TOKENS_SENTRY_EXTRAS);
        return { kind: 'unavailable' };
    }
}

function reportFailure(failure: JupiterFailure, sentryExtras: Record<string, unknown>): void {
    if (failure.kind === 'rate-limited') {
        Logger.warn('[token-info] Jupiter rate limit exceeded', { sentry: true, sentryExtras });
        return;
    }
    reportJupiterError({ error: failure.error, message: '[token-info] Token lookup unavailable', sentryExtras });
}

type JupiterFailure = Exclude<JupiterTokensResult, { kind: 'resolved' }>;

type JupiterTokenInfosResult = { kind: 'resolved'; tokens: TokenInfo[] } | JupiterFailure;

const JUPITER_TIMEOUT_MS = 5_000;

async function getJupiterTokenInfos(addresses: string[], chainId: ChainId): Promise<JupiterTokenInfosResult> {
    if (!jupiterListsTokensOn(chainId)) return NOTHING_LISTED;

    const apiKey = process.env.JUPITER_API_KEY;
    if (!apiKey) return missingApiKeyFailure();

    const result = await searchJupiterTokens({
        apiKey,
        query: addresses.join(','),
        revalidate: REVALIDATE_S,
        signal: AbortSignal.timeout(JUPITER_TIMEOUT_MS),
    });
    if (result.kind !== 'resolved') return result;

    const requested = new Set(addresses);
    const tokens = result.tokens
        .filter(token => requested.has(token.id))
        .map(toTokenInfo)
        .map(redactTokenInfo);
    return { kind: 'resolved', tokens };
}

function missingApiKeyFailure(): JupiterFailure {
    return { error: new Error('JUPITER_API_KEY is not configured'), kind: 'unavailable' };
}

async function addMetaplexTokenInfos({
    addresses,
    cluster,
    tokens,
}: {
    addresses: string[];
    cluster: Cluster;
    tokens: TokenInfo[];
}): Promise<TokenInfo[]> {
    const listedAddresses = new Set(tokens.map(token => token.address));
    const unlistedAddresses = addresses.filter(address => !listedAddresses.has(address));
    if (unlistedAddresses.length === 0 || cluster === Cluster.Custom) return tokens;

    try {
        const onChainTokens = await getTokenInfosFromMetaplex(unlistedAddresses, serverClusterUrl(cluster), {
            onError: error => Logger.warn('[token-info] Metaplex lookup failed', { error }),
        });
        return [...tokens, ...onChainTokens];
    } catch (error) {
        Logger.warn('[token-info] Metaplex fallback failed', { error });
        return tokens;
    }
}

const NOTHING_LISTED: JupiterTokenInfosResult = { kind: 'resolved', tokens: [] };

const REVALIDATE_S = 3600;

// The Next data cache keeps whatever the function returns, so a failure throws to stay out of it.
const getCachedVerifiedTokenInfos = unstable_cache(
    async (): Promise<TokenInfo[]> => {
        const apiKey = process.env.JUPITER_API_KEY;
        const result = apiKey
            ? await fetchJupiterVerifiedTokens({ apiKey, signal: AbortSignal.timeout(JUPITER_TIMEOUT_MS) })
            : missingApiKeyFailure();
        if (result.kind !== 'resolved') {
            reportFailure(result, VERIFIED_TOKENS_SENTRY_EXTRAS);
            throw new JupiterFailureError(result);
        }
        return result.tokens.map(toTokenInfo);
    },
    ['jupiter-verified-token-infos'],
    { revalidate: REVALIDATE_S },
);

const VERIFIED_TOKENS_SENTRY_EXTRAS = { tag: 'verified' };

class JupiterFailureError extends Error {
    constructor(readonly failure: JupiterFailure) {
        super('[token-info] Jupiter verified tokens lookup failed');
    }
}

function toTokenInfo(token: JupiterToken): TokenInfo {
    const verified = token.isVerified === true;
    return {
        address: token.id,
        decimals: token.decimals,
        logoURI: token.icon ?? undefined,
        name: token.name || undefined,
        symbol: token.symbol || undefined,
        verified,
        website: verified ? (token.website ?? undefined) : undefined,
    };
}

function redactTokenInfo(token: TokenInfo): TokenInfo {
    if (!isRedactedTokenAddress(token.address)) return token;
    return { address: token.address, decimals: token.decimals, verified: token.verified };
}
