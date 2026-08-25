import { type Cluster, clusterFromSlug, DEFAULT_CLUSTER } from './cluster';
import { parseRpcEndpoint, type RpcEndpoint } from './rpc-endpoint';
import { getWhitelistedRpcHostnames } from './whitelisted-rpcs';

export { DEFAULT_CUSTOM_URL } from './rpc-endpoint';

export function parseQuery(searchParams: URLSearchParams | null): Cluster {
    const clusterParam = searchParams?.get('cluster');
    if (clusterParam) {
        return clusterFromSlug(clusterParam) ?? DEFAULT_CLUSTER;
    }
    return DEFAULT_CLUSTER;
}

// Three outcomes, because a link is not a decision. `pending` is a valid endpoint nobody has agreed to
// yet: without it, the only alternative to honoring an endpoint is falling back to the default in
// silence, so a shared link connects to a different node and the user never finds out why.
//
// The usable outcomes carry an `RpcEndpoint`, not a string. This is the app's only parse of an inbound
// endpoint, so it passes the result on instead of making every consumer redo it.
export type CustomUrlDecision =
    { kind: 'honored'; endpoint: RpcEndpoint } | { kind: 'pending'; endpoint: RpcEndpoint } | { kind: 'refused' };

// `candidateUrl` MUST be the URL the caller will actually use. Checking one URL and using another turns
// this into an on/off switch instead of a decision about a specific endpoint.
//
// The active cluster is deliberately not an input. A link sets the cluster, so the cluster can never be
// evidence of consent — otherwise `?cluster=custom&customUrl=…` would point the browser at any RPC node.
// Callers decide whether the param is *relevant* (only on Custom); this decides whether it is trusted.
export function decideCustomUrl({
    approvedOrigins,
    candidateUrl,
    devFlagEnabled,
}: {
    approvedOrigins: readonly string[];
    candidateUrl: string;
    devFlagEnabled: boolean;
}): CustomUrlDecision {
    // First, so no later branch can wave through a `javascript:` or `file:` URL.
    const endpoint = parseRpcEndpoint(candidateUrl);
    if (!endpoint) return { kind: 'refused' };

    if (devFlagEnabled) return { endpoint, kind: 'honored' };

    // A link pointing at the visitor's own machine reaches nothing the sender can read back, and it is
    // the common case for a local validator.
    if (endpoint.isLocal) return { endpoint, kind: 'honored' };

    // Hosts the deployment vetted need no per-user decision. Empty unless it configures some.
    if (getWhitelistedRpcHostnames().includes(endpoint.hostname)) return { endpoint, kind: 'honored' };

    // Per origin, because the origin is who receives the queries: a rotated API key or a different path
    // is the same server, so it must not ask again.
    if (approvedOrigins.includes(endpoint.origin)) return { endpoint, kind: 'honored' };

    return { endpoint, kind: 'pending' };
}

// Whether a `customUrl` is worth keeping in a URL we build. Trust is deliberately not part of it: a
// `pending` param must survive in-app navigation, or the consent prompt loses the endpoint it is asking
// about. Asking a weaker question than `decideCustomUrl` also keeps this from ever being the stricter of
// the two and dropping an endpoint the page is using.
export function isCustomUrlCarryable(candidateUrl: string | null | undefined): boolean {
    return parseRpcEndpoint(candidateUrl) !== undefined;
}
