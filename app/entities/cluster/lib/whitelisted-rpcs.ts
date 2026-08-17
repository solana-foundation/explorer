import { Logger } from '@shared/lib/logger';
import { parseUrl } from '@shared/lib/url';

/**
 * Duplicated as a string for the log message only. It cannot be the single source: Next inlines a
 * `NEXT_PUBLIC_` var into the client bundle only through a static `process.env.NAME` member access, so a
 * `process.env[ENV_VAR]` lookup would read back `undefined` in the browser and silently empty the list.
 */
const ENV_VAR = 'NEXT_PUBLIC_WHITELISTED_RPCS';

const NONE: readonly string[] = Object.freeze([]);

/**
 * Hosts the deployment vouches for, as lowercase hostnames to compare against `RpcEndpoint.hostname`.
 * Empty unless the deployment configures some — who gets a standing grant of consent belongs to whoever
 * runs the deployment, not to this source tree.
 *
 * Parsed lazily, so importing this file never logs during app boot, and cached against the raw env
 * string, so a deployment warns once while a test that restubs the env still sees its new value.
 */
export function getWhitelistedRpcHostnames(): readonly string[] {
    const raw = process.env.NEXT_PUBLIC_WHITELISTED_RPCS;
    // Not `cache?.raw === raw`: with the var unset both sides are `undefined` on the first call, which
    // would read as a hit against a cache that does not exist yet.
    if (cache !== undefined && cache.raw === raw) return cache.hostnames;
    const hostnames = parseWhitelist(raw);
    cache = { hostnames, raw };
    return hostnames;
}

let cache: { hostnames: readonly string[]; raw: string | undefined } | undefined;

function parseWhitelist(raw: string | undefined): readonly string[] {
    if (!raw) return NONE;
    const hostnames: string[] = [];
    for (const entry of raw.split(',')) {
        const candidate = entry.trim();
        if (candidate === '') continue;
        const hostname = toHostname(candidate);
        if (!hostname) {
            // Skip the entry and keep the rest: a typo in one host must not drop the others, and must not
            // fail open into honoring something unvetted either.
            //
            // Warn, not capture: a misconfigured env var is identical on every page load, so Sentry would
            // get one report per visitor session. The server render logs it where the operator can read it.
            Logger.warn(`[cluster:whitelisted-rpcs] skipping invalid ${ENV_VAR} entry`, {
                entry: candidate,
                expected: 'a bare lowercase hostname, e.g. rpc.example.com (no scheme, port, path or wildcard)',
            });
            continue;
        }
        hostnames.push(hostname);
    }
    return Object.freeze(hostnames);
}

/**
 * Returns `entry` as a hostname, or `undefined` if it is anything else.
 *
 * The round trip — parse as a host, then require the parsed hostname to equal what was written — is what
 * makes this strict. `URL` quietly absorbs a scheme, port, path, query or `user@` prefix, and each of
 * those changes what the entry matches: `rpc.example.com@evil.io` reads as `rpc.example.com` but resolves
 * to hostname `evil.io`.
 *
 * It also rejects unicode hostnames, which normalise to punycode. That loses nothing, since
 * `RpcEndpoint.hostname` is always punycode; the log tells the operator to write `xn--mnchen-3ya.de`.
 */
function toHostname(entry: string): string | undefined {
    // Ahead of the parse, because `URL` accepts `*.example.com` as a hostname. It would sit in the list
    // matching nothing while the operator who wrote it expects subdomain matching.
    if (entry.includes('*')) return undefined;
    const url = parseUrl(`https://${entry}`);
    if (!url) return undefined;
    const hostname = entry.toLowerCase();
    return url.hostname === hostname ? hostname : undefined;
}
