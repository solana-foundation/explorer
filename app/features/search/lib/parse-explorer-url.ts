import { Cluster } from '@utils/cluster';

type RouteMapping = {
    /** Path segment used by the external explorer (e.g. "account", "tx"). */
    externalSegment: string;
    /** Corresponding local route prefix (e.g. "/address", "/tx"). */
    localRoute: string;
    /** User-facing label shown in search results (e.g. "Transaction", "Account"). */
    displayName: string;
};

type ExternalExplorer = {
    hostname: string;
    routes: RouteMapping[];
    /**
     * Maps the explorer's `?cluster=` values to our Cluster enum.
     * Values absent from this map resolve to {@link Cluster.MainnetBeta}.
     */
    clusters: Record<string, Cluster>;
};

const EXPLORERS: ExternalExplorer[] = [
    {
        clusters: {
            devnet: Cluster.Devnet,
            'mainnet-beta': Cluster.MainnetBeta,
            testnet: Cluster.Testnet,
        },
        hostname: 'solscan.io',
        routes: [
            { displayName: 'Account', externalSegment: 'account', localRoute: '/address' },
            { displayName: 'Token', externalSegment: 'token', localRoute: '/address' },
            { displayName: 'Transaction', externalSegment: 'tx', localRoute: '/tx' },
            { displayName: 'Block', externalSegment: 'block', localRoute: '/block' },
        ],
    },
    {
        clusters: {
            devnet: Cluster.Devnet,
            testnet: Cluster.Testnet,
        },
        hostname: 'orb.markets',
        routes: [
            { displayName: 'Address', externalSegment: 'address', localRoute: '/address' },
            { displayName: 'Transaction', externalSegment: 'tx', localRoute: '/tx' },
            { displayName: 'Block', externalSegment: 'block', localRoute: '/block' },
            { displayName: 'Epoch', externalSegment: 'epoch', localRoute: '/epoch' },
        ],
    },
];

export type ParsedExplorerUrl = {
    /** Canonical hostname of the source explorer (e.g. "solscan.io"). */
    source: string;
    /** User-facing entity label (e.g. "Account", "Transaction"). */
    entity: string;
    /** Local pathname without cluster query string (e.g. "/address/ABC"). */
    pathname: string;
    /** Route type derived from the local route prefix (e.g. "address", "tx"). */
    type: string;
    /** Resolved cluster from the external URL. */
    cluster: Cluster;
};

/**
 * Parse an external Solana explorer URL into a local route.
 *
 * Returns `undefined` when the input is not a recognised explorer URL.
 */
export function parseExplorerUrl(input: string): ParsedExplorerUrl | undefined {
    const url = toHttpUrl(input);
    if (!url) return undefined;

    const explorer = findExplorer(url.hostname);
    if (!explorer) return undefined;

    // e.g. "/account/ABC/transfers" → ["", "account", "ABC", "transfers"]
    // We only care about the type segment and identifier; trailing segments are ignored.
    const segments = url.pathname.split('/');
    if (segments.length < 3) return undefined;

    const pathSegment = segments[1];
    const route = explorer.routes.find(r => r.externalSegment === pathSegment);
    if (!route) return undefined;

    const identifier = extractIdentifier(segments[2]);
    if (!identifier) return undefined;

    return {
        cluster: resolveCluster(explorer, url.searchParams.get('cluster')),
        entity: route.displayName,
        pathname: `${route.localRoute}/${identifier}`,
        source: explorer.hostname,
        type: route.localRoute.slice(1),
    };
}

function toHttpUrl(input: string): URL | undefined {
    let url: URL;
    try {
        url = new URL(input.trim());
    } catch {
        return undefined;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url;
}

function findExplorer(hostname: string): ExternalExplorer | undefined {
    const normalised = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    return EXPLORERS.find(e => e.hostname === normalised);
}

function extractIdentifier(rawSegment: string): string | undefined {
    if (!rawSegment) return undefined;
    const decoded = decodeURIComponent(rawSegment).trim();
    if (!decoded || decoded.includes('/')) return undefined;
    return decoded;
}

function resolveCluster(explorer: ExternalExplorer, rawCluster: string | null): Cluster {
    if (!rawCluster) return Cluster.MainnetBeta;
    return explorer.clusters[rawCluster] ?? Cluster.MainnetBeta;
}
