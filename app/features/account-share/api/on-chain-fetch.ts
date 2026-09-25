import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';

import { Logger } from '@/app/shared/lib/logger';

/**
 * SSRF guard for the account share-image route.
 *
 * The shared IDL / security.txt resolvers follow `Program-Metadata` records, and a program author can store
 * an off-chain *URL* in that record which the resolver would `fetch()` server-side - letting an attacker aim
 * this unauthenticated endpoint at internal addresses (localhost, cloud metadata, service mesh). We cannot
 * pass a custom fetch into those third-party resolvers, so instead we scope `globalThis.fetch` while the
 * provenance work runs: only our own trusted backends (the cluster RPC and the OSEC registry) are allowed,
 * and every other destination - i.e. anything sourced from on-chain content - is refused outright.
 *
 * The patch is installed once and is a no-op outside a scope, so ordinary fetches elsewhere are untouched.
 * Scoping is per async-execution via `AsyncLocalStorage`, so concurrent requests never see each other's
 * allow-lists.
 */
const allowedHostsStore = new AsyncLocalStorage<Set<string>>();

let patched = false;

function patchGlobalFetch(): void {
    if (patched) return;
    patched = true;

    const realFetch = globalThis.fetch;
    globalThis.fetch = function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const allowedHosts = allowedHostsStore.getStore();
        if (!allowedHosts) return realFetch(input, init);

        const host = hostOf(input);
        if (host !== undefined && allowedHosts.has(host)) return realFetch(input, init);

        Logger.warn('[account-share] Blocked an off-chain fetch during provenance resolution (SSRF guard)', {
            host: host ?? 'unparseable',
        });
        return Promise.reject(new Error(`Blocked off-chain fetch to ${host ?? 'unparseable host'}`));
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
 * refused. Pass the cluster RPC URL and the OSEC registry URL (our own trusted backends) - anything absent
 * or unparseable is ignored. Requests to blocked hosts reject, which each provenance leg already fails soft
 * on, so an attacker-planted URL degrades to an `unknown` marker instead of an internal request.
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
