import { type GenesisHash, getChainId } from '@entities/chain-id/@x/token-info';
import { chunk } from '@shared/lib/array';
import { ROUTE_TIMEOUT_MS } from '@shared/lib/timeouts';
import { isAddress } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { fetchAll } from '@utils/fetch-all';
import { array, is, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { jupiterListsTokensOn } from '../lib/jupiter-lists-tokens-on';
import { TOKEN_INFO_REQUEST_LIMIT } from '../lib/request-limit';
import { type TokenInfoLookup, type TokenInfosLookup, toTokenInfoLookup } from '../lib/token-info-lookup';
import { type TokenInfo, TokenInfoStruct } from '../lib/types';

export async function lookupTokenInfo({
    cluster,
    genesisHash,
    includeOnChainFallback = false,
    mint,
}: {
    cluster: Cluster;
    genesisHash: GenesisHash | undefined;
    includeOnChainFallback?: boolean;
    mint: string;
}): Promise<TokenInfoLookup> {
    if (!isAddress(mint)) return { kind: 'not-listed' };
    const chainId = getChainId(cluster, genesisHash);
    if (!chainId) return { kind: 'not-listed' };
    if (!includeOnChainFallback && !jupiterListsTokensOn(chainId)) return { kind: 'not-listed' };
    return queueLookup({ cluster, genesisHash, includeOnChainFallback }, mint);
}

export function lookupVerifiedTokenInfos({ addresses }: { addresses: readonly string[] }): Promise<TokenInfosLookup> {
    return sendTokenInfoRequest({
        ...toJsonPost('/api/token-info/verified', { addresses }),
        sentryExtras: { addressCount: addresses.length, tag: 'verified' },
        timeoutMs: JUPITER_ROUTE_TIMEOUT_MS,
    });
}

type BatchRequest = { cluster: Cluster; genesisHash: GenesisHash | undefined; includeOnChainFallback: boolean };

type Batch = { request: BatchRequest; resolvers: Map<string, ((lookup: TokenInfoLookup) => void)[]> };

// The address layout waits for token info, so a window longer than one frame delays every mint page.
const BATCH_WINDOW_MS = 16;

const batches = new Map<string, Batch>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function queueLookup(request: BatchRequest, mint: string): Promise<TokenInfoLookup> {
    return new Promise(resolve => {
        const batchKey = [request.cluster, request.genesisHash, request.includeOnChainFallback].join('|');
        const batch = batches.get(batchKey) ?? { request, resolvers: new Map() };
        batches.set(batchKey, batch);
        batch.resolvers.set(mint, [...(batch.resolvers.get(mint) ?? []), resolve]);
        flushTimer ??= setTimeout(flushBatches, BATCH_WINDOW_MS);
    });
}

function flushBatches(): void {
    flushTimer = undefined;
    const queued = [...batches.values()];
    batches.clear();
    for (const batch of queued) void sendBatch(batch);
}

const CHUNK_CONCURRENCY = 6;

// The timeout must exceed the server timeout on Jupiter requests, to allow for a cold start.
export const JUPITER_ROUTE_TIMEOUT_MS = 15_000;

async function sendBatch({ request, resolvers }: Batch): Promise<void> {
    const queued = [...resolvers].sort(([a], [b]) => (a < b ? -1 : 1));

    await fetchAll(
        chunk(queued, TOKEN_INFO_REQUEST_LIMIT),
        async entries => {
            const addresses = entries.map(([mint]) => mint);
            const result = await lookupTokenInfos({ ...request, addresses });
            for (const [mint, mintResolvers] of entries) {
                const lookup = toTokenInfoLookup(result, mint);
                mintResolvers.forEach(resolve => resolve(lookup));
            }
        },
        CHUNK_CONCURRENCY,
    );
}

type RouteRequest = BatchRequest & { addresses: string[] };

function lookupTokenInfos(request: RouteRequest): Promise<TokenInfosLookup> {
    return sendTokenInfoRequest({
        ...toFetchArgs(request),
        sentryExtras: { addressCount: request.addresses.length, cluster: request.cluster },
        timeoutMs: request.includeOnChainFallback ? ROUTE_TIMEOUT_MS : JUPITER_ROUTE_TIMEOUT_MS,
    });
}

async function sendTokenInfoRequest({
    init,
    sentryExtras,
    timeoutMs,
    url,
}: {
    init: RequestInit;
    sentryExtras: Record<string, unknown>;
    timeoutMs: number;
    url: string;
}): Promise<TokenInfosLookup> {
    try {
        const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

        if (!response.ok) {
            Logger.warn('[token-info] Token info request rejected', {
                sentry: true,
                sentryExtras: { ...sentryExtras, status: response.status },
            });
            return response.status === 429 ? { kind: 'rate-limited' } : { kind: 'unavailable' };
        }

        const body: unknown = await response.json();
        if (!is(body, TokenInfoResponseStruct)) {
            Logger.warn('[token-info] Token info response was not a token array', { sentry: true });
            return { kind: 'unavailable' };
        }

        return { kind: 'resolved', tokens: parseTokenInfos(body.content, sentryExtras) };
    } catch (error) {
        Logger.error(new Error('[token-info] Failed to fetch token info', { cause: error }), {
            sentry: true,
            sentryExtras,
        });
        return { kind: 'unavailable' };
    }
}

function toFetchArgs({ addresses, cluster, genesisHash, includeOnChainFallback }: RouteRequest): {
    init: RequestInit;
    url: string;
} {
    if (addresses.length === 1 && !includeOnChainFallback) {
        const query = new URLSearchParams({ cluster: String(cluster) });
        // A named cluster needs no hash, and sending one gives the same mint a second CDN cache key.
        if (cluster === Cluster.Custom && genesisHash) query.set('genesisHash', genesisHash);
        return {
            init: { method: 'GET' },
            url: `/api/token-info/${encodeURIComponent(addresses[0])}?${query.toString()}`,
        };
    }
    return toJsonPost('/api/token-info', { addresses, cluster, genesisHash, includeOnChainFallback });
}

function toJsonPost(url: string, body: unknown): { init: RequestInit; url: string } {
    return {
        init: { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, method: 'POST' },
        url,
    };
}

const TokenInfoResponseStruct = type({ content: array() });

function parseTokenInfos(entries: unknown[], sentryExtras: Record<string, unknown>): TokenInfo[] {
    const tokens = entries.filter(entry => is(entry, TokenInfoStruct));
    const malformed = entries.length - tokens.length;
    if (malformed > 0) {
        Logger.warn('[token-info] Dropped malformed token info entries', {
            sentry: 'always',
            sentryExtras: { ...sentryExtras, malformed, total: entries.length },
        });
    }
    return tokens;
}
