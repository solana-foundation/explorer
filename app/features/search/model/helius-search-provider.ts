import { clusterSlug } from '@utils/cluster';

import { Logger } from '@/app/shared/lib/logger';

import type { SearchContext, SearchItem, SearchOptions, SearchProvider } from '../lib/types';

const SEARCH_CACHE_TTL_MS = 30_000;
const SEARCH_CACHE_MAX_SIZE = 100;
const SEARCH_LIMIT = 20;

type SearchQueryType = 'address' | 'domain' | 'numeric' | 'text' | 'transaction';

type UnifiedSearchResponse = {
    meta?: {
        timing?: Record<string, number>;
        total: number;
    };
    query: string;
    queryType: SearchQueryType;
    results: {
        accounts?: AccountSearchResult[];
        blocks?: BlockSearchResult[];
        domains?: DomainSearchResult[];
        epochs?: EpochSearchResult[];
        labeledAccounts?: LabeledAccountSearchResult[];
        programs?: ProgramSearchResult[];
        systemAccounts?: SystemAccountSearchResult[];
        tokens?: TokenSearchResult[];
        transactions?: TransactionSearchResult[];
        validators?: ValidatorSearchResult[];
    };
    success: boolean;
};

type TokenSearchResult = {
    category?: string | null;
    decimals?: number | null;
    fdv?: number | null;
    icon?: string | null;
    isCurated: boolean;
    isVerified: boolean;
    liquidity?: number | null;
    mcap?: number | null;
    name: string;
    organicScore?: number | null;
    organicScoreLabel?: string | null;
    shortName?: string | null;
    ticker: string;
    tokenAddress: string;
};

type ValidatorSearchResult = {
    activatedStake: number;
    commission: number;
    delinquent: boolean;
    identity: string;
    image?: string | null;
    name: string;
    version: string;
    voteAccount: string;
    wizScore: number;
};

type DomainSearchResult = {
    address?: string | null;
    domain: string;
    owner?: string | null;
    tld: 'ans' | 'sol';
};

type AccountSearchResult = {
    address: string;
    category?: string | null;
    label?: string | null;
};

type TransactionSearchResult = {
    signature: string;
};

type BlockSearchResult = {
    slot: number;
};

type EpochSearchResult = {
    epoch: number;
};

type ProgramSearchResult = {
    address: string;
    icon?: string | null;
    name: string;
};

type LabeledAccountSearchResult = {
    address: string;
    category?: string | null;
    label: string;
};

type SystemAccountSearchResult = {
    accountType: 'loader' | 'special' | 'sysvar';
    address: string;
    name: string;
};

const searchCache = new Map<string, { data: SearchOptions[]; expiresAt: number }>();

const GROUP_ORDER = [
    'Tokens',
    'Validators',
    'Programs',
    'Program Loaders',
    'Sysvars',
    'Accounts',
    'Transactions',
    'Blocks',
    'Epochs',
    'Domains',
    'Domain Owners',
    'Name Service Accounts',
] as const;

function pushOption(
    groupedOptions: Map<string, SearchItem[]>,
    seen: Set<string>,
    groupLabel: string,
    option: SearchItem | undefined,
) {
    if (!option) return;

    const dedupeKey = `${groupLabel}|${option.pathname}|${option.label}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const existingOptions = groupedOptions.get(groupLabel) ?? [];
    existingOptions.push(option);
    groupedOptions.set(groupLabel, existingOptions);
}

function buildOption(
    label: string,
    pathname: string,
    value: Array<string | undefined | null>,
    meta?: Pick<SearchItem, 'icon' | 'verified'>,
): SearchItem {
    return {
        label,
        pathname,
        value: value.filter((part): part is string => Boolean(part)),
        ...meta,
    };
}

function mapUnifiedSearchResponse(response: UnifiedSearchResponse): SearchOptions[] {
    const groupedOptions = new Map<string, SearchItem[]>();
    const seen = new Set<string>();

    for (const token of response.results.tokens ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Tokens',
            buildOption(
                `${token.ticker} - ${token.name}`,
                '/address/' + token.tokenAddress,
                [token.name, token.ticker, token.tokenAddress, token.shortName ?? undefined],
                { icon: token.icon ?? undefined, verified: token.isVerified },
            ),
        );
    }

    for (const validator of response.results.validators ?? []) {
        const label = validator.name ? `${validator.name} - ${validator.identity}` : validator.identity;
        pushOption(
            groupedOptions,
            seen,
            'Validators',
            buildOption(
                label,
                '/address/' + validator.identity,
                [validator.name, validator.identity, validator.voteAccount],
                { icon: validator.image ?? undefined },
            ),
        );
    }

    for (const program of response.results.programs ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Programs',
            buildOption(
                program.name || program.address,
                '/address/' + program.address,
                [program.name, program.address],
                {
                    icon: program.icon ?? undefined,
                },
            ),
        );
    }

    for (const systemAccount of response.results.systemAccounts ?? []) {
        const label =
            systemAccount.accountType === 'loader'
                ? 'Program Loaders'
                : systemAccount.accountType === 'sysvar'
                  ? 'Sysvars'
                  : 'Accounts';

        pushOption(
            groupedOptions,
            seen,
            label,
            buildOption(systemAccount.name, '/address/' + systemAccount.address, [
                systemAccount.name,
                systemAccount.address,
            ]),
        );
    }

    for (const account of response.results.accounts ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Accounts',
            buildOption(account.label || account.address, '/address/' + account.address, [
                account.label ?? undefined,
                account.address,
                account.category ?? undefined,
            ]),
        );
    }

    for (const labeledAccount of response.results.labeledAccounts ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Accounts',
            buildOption(labeledAccount.label, '/address/' + labeledAccount.address, [
                labeledAccount.label,
                labeledAccount.address,
                labeledAccount.category ?? undefined,
            ]),
        );
    }

    for (const transaction of response.results.transactions ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Transactions',
            buildOption(transaction.signature, '/tx/' + transaction.signature, [transaction.signature]),
        );
    }

    for (const block of response.results.blocks ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Blocks',
            buildOption(`Slot #${block.slot}`, '/block/' + block.slot, [block.slot.toString()]),
        );
    }

    for (const epoch of response.results.epochs ?? []) {
        pushOption(
            groupedOptions,
            seen,
            'Epochs',
            buildOption(`Epoch #${epoch.epoch}`, '/epoch/' + epoch.epoch, [epoch.epoch.toString()]),
        );
    }

    for (const domain of response.results.domains ?? []) {
        const domainLabel = `${domain.domain}`;

        if (domain.owner) {
            pushOption(
                groupedOptions,
                seen,
                'Domain Owners',
                buildOption(domainLabel, '/address/' + domain.owner, [domainLabel, domain.owner]),
            );
        }

        if (domain.address) {
            pushOption(
                groupedOptions,
                seen,
                'Name Service Accounts',
                buildOption(domainLabel, '/address/' + domain.address, [domainLabel, domain.address]),
            );
        }
    }

    return Array.from(groupedOptions.entries())
        .sort(([leftLabel], [rightLabel]) => {
            const leftIndex = GROUP_ORDER.indexOf(leftLabel as (typeof GROUP_ORDER)[number]);
            const rightIndex = GROUP_ORDER.indexOf(rightLabel as (typeof GROUP_ORDER)[number]);

            const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
            const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
            return normalizedLeft - normalizedRight || leftLabel.localeCompare(rightLabel);
        })
        .map(([label, options]) => ({ label, options }));
}

function isUnifiedSearchResponse(data: unknown): data is UnifiedSearchResponse {
    if (!data || typeof data !== 'object') return false;

    const candidate = data as Partial<UnifiedSearchResponse>;
    return typeof candidate.success === 'boolean' && typeof candidate.query === 'string' && !!candidate.results;
}

export const heliusSearchProvider: SearchProvider = {
    kind: 'remote',
    name: 'helius',
    priority: 100,
    async search(query: string, ctx: SearchContext): Promise<SearchOptions[]> {
        if (process.env.NEXT_PUBLIC_DISABLE_TOKEN_SEARCH || !query.trim()) {
            return [];
        }

        const trimmed = query.trim();
        const cacheKey = `${trimmed.toLowerCase()}|${clusterSlug(ctx.cluster)}|${SEARCH_LIMIT}`;
        const cachedResult = searchCache.get(cacheKey);
        if (cachedResult && cachedResult.expiresAt > Date.now()) {
            return cachedResult.data;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        try {
            const url = new URLSearchParams({
                cluster: clusterSlug(ctx.cluster),
                limit: SEARCH_LIMIT.toString(),
                q: trimmed,
            });

            const response = await fetch(`/api/search?${url.toString()}`, {
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            });

            if (!response.ok) {
                Logger.error(new Error('[helius-search] Helius unified search error'), {
                    query: trimmed,
                    status: response.status.toString(),
                });
                return [];
            }

            const data = await response.json();
            if (!isUnifiedSearchResponse(data) || !data.success) {
                Logger.error(new Error('[helius-search] Invalid Helius unified search response'), { query: trimmed });
                return [];
            }

            const sections = mapUnifiedSearchResponse(data);
            if (searchCache.size >= SEARCH_CACHE_MAX_SIZE) {
                const firstKey = searchCache.keys().next().value;
                if (firstKey !== undefined) searchCache.delete(firstKey);
            }
            searchCache.set(cacheKey, {
                data: sections,
                expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
            });
            return sections;
        } catch (error) {
            Logger.error(error instanceof Error ? error : new Error('[helius-search] Helius search request failed'), {
                query: trimmed,
            });
            return [];
        } finally {
            clearTimeout(timeoutId);
        }
    },
};
