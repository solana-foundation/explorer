/**
 * GET /api/search?q=<query>&cluster=<cluster>
 *
 * Returns structured search results matching what the SearchBar component returns.
 * Useful for programmatic search, tooling, and quick-navigation integrations.
 * Addresses https://github.com/solana-labs/explorer/issues/223
 */
import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { array, boolean, is, optional, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterFromSlug } from '@/app/utils/cluster';
import { LOADER_IDS, PROGRAM_INFO_BY_ID, SPECIAL_IDS, SYSVAR_IDS } from '@/app/utils/programs';

import { NO_STORE_HEADERS } from './config';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const SEARCHABLE_LOADERS = ['BPF Loader', 'BPF Loader 2', 'BPF Upgradeable Loader'];
const TIMEOUT_MS = 5000;
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

export type SearchResult = {
    address?: string;
    category: string;
    label: string;
    pathname: string;
    symbol?: string;
    verified?: boolean;
};

const JupiterTokenSchema = type({
    icon: optional(string()),
    id: string(),
    isVerified: optional(boolean()),
    name: optional(string()),
    symbol: optional(string()),
});

const JupiterSearchResponseSchema = array(JupiterTokenSchema);

const UtlTokenSchema = type({
    address: string(),
    name: string(),
    symbol: string(),
    verified: boolean(),
});

const UtlSearchResponseSchema = type({
    content: array(UtlTokenSchema),
});

function buildLocalResults(query: string, cluster: Cluster): SearchResult[] {
    const q = query.trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    // Programs
    for (const [address, { name, deployments }] of Object.entries(PROGRAM_INFO_BY_ID)) {
        if (!deployments.includes(cluster)) continue;
        if (!name.toLowerCase().includes(q.toLowerCase()) && !address.includes(q)) continue;
        results.push({ category: 'Programs', label: name, pathname: '/address/' + address });
    }

    // Loaders
    for (const [address, name] of Object.entries(LOADER_IDS)) {
        if (!SEARCHABLE_LOADERS.includes(name)) continue;
        if (!name.toLowerCase().includes(q.toLowerCase()) && !address.includes(q)) continue;
        results.push({ category: 'Program Loaders', label: name, pathname: '/address/' + address });
    }

    // Sysvars
    for (const [address, name] of Object.entries(SYSVAR_IDS)) {
        if (!name.toLowerCase().includes(q.toLowerCase()) && !address.includes(q)) continue;
        results.push({ category: 'Sysvars', label: name, pathname: '/address/' + address });
    }

    // Special accounts
    for (const [address, name] of Object.entries(SPECIAL_IDS)) {
        if (!name.toLowerCase().includes(q.toLowerCase()) && !address.includes(q)) continue;
        results.push({ category: 'Accounts', label: name, pathname: '/address/' + address });
    }

    // Block/Epoch (numeric)
    if (!isNaN(Number(q))) {
        results.push({ category: 'Block', label: `Slot #${q}`, pathname: `/block/${q}` });
        results.push({ category: 'Epoch', label: `Epoch #${q}`, pathname: `/epoch/${q}` });
    }

    // Address / Transaction (BS58)
    if (results.length === 0) {
        try {
            const decoded = bs58.decode(q);
            if (decoded.length === 32) {
                results.push({ category: 'Account', label: q, pathname: '/address/' + q });
            } else if (decoded.length === 64) {
                results.push({ category: 'Transaction', label: q, pathname: '/tx/' + q });
            }
        } catch {
            // not a valid bs58 string
        }
    }

    return results;
}

async function searchTokensForCluster(query: string, cluster: Cluster): Promise<SearchResult[]> {
    if (cluster === Cluster.MainnetBeta) {
        if (!JUPITER_API_KEY) {
            return [];
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': JUPITER_API_KEY },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    Logger.warn('[api:search] Jupiter rate limit exceeded', { sentry: true });
                } else {
                    Logger.panic(new Error(`[api:search] Jupiter API error: ${response.status}`));
                }
                return [];
            }

            const data = await response.json();

            if (!is(data, JupiterSearchResponseSchema)) {
                return [];
            }

            return data.map(t => ({
                address: t.id,
                category: 'Tokens',
                label: `${t.symbol ?? ''} · ${t.name ?? ''}`,
                pathname: '/address/' + t.id,
                symbol: t.symbol,
                verified: t.isVerified ?? false,
            }));
        } catch (error) {
            clearTimeout(timeoutId);
            Logger.panic(error instanceof Error ? error : new Error('[api:search] Jupiter search failed'));
            return [];
        }
    }

    const chainIdMap: Partial<Record<Cluster, number>> = {
        [Cluster.Devnet]: 103,
        [Cluster.Testnet]: 102,
    };
    const chainId = chainIdMap[cluster];
    if (!chainId) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(
            `https://token-list-api.solana.cloud/v1/search?query=${encodeURIComponent(query)}&chainId=${chainId}&start=0&limit=20`,
            { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:search] UTL API rate limit exceeded', { sentry: true });
            } else {
                Logger.panic(new Error(`[api:search] UTL API error: ${response.status}`));
            }
            return [];
        }

        const data = await response.json();

        if (!is(data, UtlSearchResponseSchema)) {
            return [];
        }

        return data.content.map(t => ({
            address: t.address,
            category: 'Tokens',
            label: `${t.symbol} · ${t.name}`,
            pathname: '/address/' + t.address,
            symbol: t.symbol,
            verified: t.verified,
        }));
    } catch (error) {
        clearTimeout(timeoutId);
        Logger.panic(error instanceof Error ? error : new Error('[api:search] UTL search failed'));
        return [];
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const clusterParam = searchParams.get('cluster') ?? 'mainnet-beta';

    if (!query?.trim()) {
        return NextResponse.json({ results: [] });
    }

    const cluster = clusterFromSlug(clusterParam) ?? Cluster.MainnetBeta;

    const [tokenResults, localResults] = await Promise.all([
        searchTokensForCluster(query, cluster),
        Promise.resolve(buildLocalResults(query, cluster)),
    ]);

    const results: SearchResult[] = [...localResults, ...tokenResults];

    return NextResponse.json({ results }, { headers: NO_STORE_HEADERS });
}
