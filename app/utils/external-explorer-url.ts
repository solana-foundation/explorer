import { SearchElement } from './token-search';

type RouteMapping = {
    /** Corresponding path prefix on this explorer (e.g. "/address", "/tx") */
    localPrefix: string;
    /** Path segment on the external explorer (e.g. "account", "tx") */
    sourcePrefix: string;
};

type ExplorerDefinition = {
    hostnames: ReadonlySet<string>;
    routes: readonly RouteMapping[];
};

const SOLSCAN: ExplorerDefinition = {
    hostnames: new Set(['solscan.io', 'www.solscan.io']),
    routes: [
        { localPrefix: '/address', sourcePrefix: 'account' },
        { localPrefix: '/tx', sourcePrefix: 'tx' },
        { localPrefix: '/address', sourcePrefix: 'token' },
        { localPrefix: '/block', sourcePrefix: 'block' },
    ],
};

const ORB_MARKETS: ExplorerDefinition = {
    hostnames: new Set(['orbmarkets.io', 'www.orbmarkets.io']),
    routes: [
        { localPrefix: '/address', sourcePrefix: 'address' },
        { localPrefix: '/tx', sourcePrefix: 'tx' },
        { localPrefix: '/block', sourcePrefix: 'block' },
        { localPrefix: '/epoch', sourcePrefix: 'epoch' },
    ],
};

const EXPLORERS: readonly ExplorerDefinition[] = [SOLSCAN, ORB_MARKETS];

/** Cluster values both sites use that map to our cluster slugs. */
const KNOWN_CLUSTERS = new Set(['devnet', 'testnet', 'mainnet-beta']);

/**
 * Attempt to parse a search string as an external Solana explorer URL.
 *
 * Returns a SearchElement ready for the dropdown if the URL is recognized,
 * or `null` if the input is not a supported explorer URL.
 */
export function parseExternalExplorerUrl(input: string): SearchElement | null {
    let url: URL;
    try {
        url = new URL(input);
    } catch {
        return null;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
    }

    const hostname = url.hostname.toLowerCase();

    for (const explorer of EXPLORERS) {
        if (!explorer.hostnames.has(hostname)) continue;

        // Split pathname: "/account/abc123/history" -> ["", "account", "abc123", "history"]
        const segments = url.pathname.split('/');
        // segments[0] is always "" (leading slash), segments[1] is the entity type, segments[2] is the identifier
        if (segments.length < 3 || !segments[1] || !segments[2]) {
            return null;
        }

        const entityType = segments[1];
        const identifier = segments[2];

        const route = explorer.routes.find(r => r.sourcePrefix === entityType);
        if (!route) {
            return null;
        }

        // Build local pathname, optionally with cluster param
        let pathname = `${route.localPrefix}/${identifier}`;
        const cluster = url.searchParams.get('cluster');
        const hasExplicitCluster = cluster !== null && KNOWN_CLUSTERS.has(cluster);
        if (hasExplicitCluster && cluster !== 'mainnet-beta') {
            pathname += `?cluster=${cluster}`;
        }

        return {
            label: identifier,
            pathname,
            value: [input, identifier],
            ...(hasExplicitCluster ? { preserveSearchParams: true } : {}),
        };
    }

    return null;
}
