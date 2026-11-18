import 'server-only';

import { type ChainId, type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { Logger } from '@shared/lib/logger';
import { isAddress } from '@solana/kit';
import { Cluster, serverClusterUrl } from '@utils/cluster';

import { reportJupiterError } from '../lib/errors';
import { isRedactedTokenAddress } from '../lib/is-redacted-token-address';
import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { type JupiterToken } from '../lib/jupiter-token';
import { type TokenInfoLookup, type TokenInfosLookup, toTokenInfoLookup } from '../lib/token-info-lookup';
import { type TokenInfo } from '../lib/types';
import { type JupiterTokensResult, searchJupiterTokens } from './fetch-jupiter-tokens';
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

function reportFailure(failure: JupiterFailure, sentryExtras: Record<string, unknown>): void {
    if (failure.kind === 'rate-limited') {
        Logger.warn('[api:token-info] Jupiter rate limit exceeded', { sentry: true, sentryExtras });
        return;
    }
    reportJupiterError({ error: failure.error, message: '[api:token-info] Token lookup unavailable', sentryExtras });
}

type JupiterFailure = Exclude<JupiterTokensResult, { kind: 'resolved' }>;

type JupiterTokenInfos = { kind: 'resolved'; tokens: TokenInfo[] } | JupiterFailure;

const JUPITER_TIMEOUT_MS = 5_000;

async function getJupiterTokenInfos(addresses: string[], chainId: ChainId): Promise<JupiterTokenInfos> {
    if (!jupiterListsTokensOn(chainId)) return NOTHING_LISTED;

    const apiKey = process.env.JUPITER_API_KEY;
    if (!apiKey) return missingApiKeyFailure();

    return fetchTokenInfosFromJupiter({ apiKey, mints: addresses, signal: AbortSignal.timeout(JUPITER_TIMEOUT_MS) });
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
            onError: error => Logger.warn('[api:token-info] Metaplex lookup failed', { error }),
        });
        return [...tokens, ...onChainTokens];
    } catch (error) {
        Logger.warn('[api:token-info] Metaplex fallback failed', { error });
        return tokens;
    }
}

const NOTHING_LISTED: JupiterTokenInfos = { kind: 'resolved', tokens: [] };

const REVALIDATE_S = 3600;

async function fetchTokenInfosFromJupiter({
    apiKey,
    mints,
    signal,
}: {
    apiKey: string;
    mints: string[];
    signal: AbortSignal;
}): Promise<JupiterTokenInfos> {
    const result = await searchJupiterTokens({ apiKey, query: mints.join(','), revalidate: REVALIDATE_S, signal });
    if (result.kind !== 'resolved') return result;

    const requested = new Set(mints);
    const tokens = result.tokens.filter(token => requested.has(token.id)).map(toTokenInfo);
    return { kind: 'resolved', tokens };
}

function toTokenInfo(token: JupiterToken): TokenInfo {
    const verified = token.isVerified === true;
    if (isRedactedTokenAddress(token.id)) return { address: token.id, decimals: token.decimals, verified };
    return {
        address: token.id,
        decimals: token.decimals,
        logoURI: token.icon ?? undefined,
        name: token.name || undefined,
        symbol: token.symbol || undefined,
        verified,
    };
}
