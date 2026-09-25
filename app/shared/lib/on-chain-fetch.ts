import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

import { Logger } from '@/app/shared/lib/logger';

/**
 * SSRF guard for the unauthenticated server routes that resolve program IDLs / security.txt.
 *
 * Those shared resolvers read `Program-Metadata` records, and a program author can store an off-chain *URL*
 * in a record which the third-party resolver then `fetch()`es server-side - letting an attacker aim our
 * server at internal addresses (localhost, cloud metadata, service mesh). We cannot pass a custom fetch into
 * those resolvers, so we scope `globalThis.fetch` for the duration of the resolution: only our own trusted
 * backends (the cluster RPC, and where relevant the OSEC registry) are allowed, and every other destination
 * - i.e. anything sourced from on-chain content - is refused with a {@link BlockedRequestError}.
 *
 * The patch is installed once and is a no-op outside a scope, so ordinary fetches elsewhere are untouched.
 * Scoping is per async-execution via `AsyncLocalStorage`, so concurrent requests never see each other's
 * allow-lists.
 *
 * Trade-off: this refuses *all* off-chain fetches, so a legitimately URL-hosted IDL/security.txt is not
 * resolved (it degrades to "absent"/"unknown"). That is deliberate - a blunt, obviously-correct control for
 * a security boundary. A future public-only variant (DNS-pinned, private-range-blocking) could preserve
 * public off-chain content while still blocking internal hosts.
 */
const allowedHostsStore = new AsyncLocalStorage<Set<string>>();

let patched = false;

/** Thrown by the scoped fetch when a request targets a host outside the allow-list. */
export class BlockedRequestError extends Error {
    constructor(host: string | undefined) {
        super(`Blocked off-chain request to ${host ?? 'an unparseable host'} (SSRF guard)`);
        this.name = 'BlockedRequestError';
    }
}

/** Whether an error is a {@link BlockedRequestError}, so callers can degrade softly instead of paging. */
export function isBlockedRequestError(error: unknown): error is BlockedRequestError {
    return error instanceof BlockedRequestError;
}

function patchGlobalFetch(): void {
    if (patched) return;
    patched = true;

    const realFetch = globalThis.fetch;
    globalThis.fetch = function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const allowedHosts = allowedHostsStore.getStore();
        if (!allowedHosts) return realFetch(input, init);

        const host = hostOf(input);
        if (host !== undefined && allowedHosts.has(host)) return realFetch(input, init);

        Logger.warn('[on-chain-fetch] Blocked an off-chain fetch (SSRF guard)', { host: host ?? 'unparseable' });
        return Promise.reject(new BlockedRequestError(host));
    };
}

/** The host of a fetch target, or undefined when it does not parse as a URL. */
function hostOf(input: RequestInfo | URL): string | undefined {
    try {
        const href = input instanceof Request ? input.url : input instanceof URL ? input.href : String(input);
        return new URL(href).host;
    } catch {
        return undefined;
    }
}

/**
 * Run `fn` with `globalThis.fetch` restricted to the hosts of `allowedUrls`; every other destination is
 * refused with a {@link BlockedRequestError}. Pass our own trusted backends (the cluster RPC URL, and the
 * OSEC registry URL where used) - anything absent or unparseable is ignored.
 */
export function withOnChainFetch<T>(allowedUrls: Array<string | undefined>, fn: () => Promise<T>): Promise<T> {
    patchGlobalFetch();

    const hosts = new Set<string>();
    for (const url of allowedUrls) {
        const host = url === undefined ? undefined : hostOf(url);
        if (host !== undefined) hosts.add(host);
    }

    return allowedHostsStore.run(hosts, fn);
}
