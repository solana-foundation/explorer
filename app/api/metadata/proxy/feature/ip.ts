import _dns, { type LookupAddress } from 'dns';
import Address from 'ipaddr.js';
import { type LookupFunction } from 'net';

import { SAFE_EXTERNAL_PROTOCOLS } from '@/app/shared/lib/url';

const dns = _dns.promises;

// IANA special-purpose IPv6 blocks missing from the ipaddr.js range table, which would otherwise pass as `unicast`.
const UNCLASSIFIED_SPECIAL_PURPOSE_IPV6 = [
    Address.IPv6.parseCIDR('64:ff9b:1::/48'), // RFC 8215, local-use IPv4/IPv6 translation
    Address.IPv6.parseCIDR('100:0:0:1::/64'), // RFC 9780, dummy IPv6 prefix
    Address.IPv6.parseCIDR('3fff::/20'), // RFC 9637, documentation
    Address.IPv6.parseCIDR('5f00::/16'), // RFC 9602, SRv6 SIDs
];

// Only unicast outside the IANA special-purpose blocks (RFC 6890) is public. Multicast is refused.
export function isPrivateIP(ip: string) {
    // `process` turns an IPv4-mapped IPv6 address into its IPv4 address, so it is judged as IPv4.
    const address = Address.process(ip);
    if (address.range() !== 'unicast') return true;
    return address instanceof Address.IPv6 && UNCLASSIFIED_SPECIAL_PURPOSE_IPV6.some(range => address.match(range));
}

export function isHTTPProtocol(url: URL) {
    return SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol);
}

function isLocalhostName(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '0' || hostname === '::1';
}

export type LookupResult =
    | { kind: 'public'; lookup: LookupFunction; addresses: LookupAddress[] }
    | { kind: 'private'; reason: string; cause?: unknown };

/**
 * Resolves a hostname once and refuses it when any address is not public.
 * The returned `lookup` replays the checked addresses to prevent DNS rebinding.
 */
export async function lookupHostnameSafely(hostname: string): Promise<LookupResult> {
    if (isLocalhostName(hostname)) {
        return { kind: 'private', reason: 'localhost' };
    }

    let addresses: LookupAddress[];
    try {
        const result = await dns.lookup(hostname, { all: true });
        // `all: true` is supposed to return an array, but the Node type union
        // includes the single-result shape; normalise either way.
        if (result === undefined) {
            return { kind: 'private', reason: 'no addresses' };
        }
        addresses = Array.isArray(result) ? result : [result];
    } catch (error) {
        return { cause: error, kind: 'private', reason: 'DNS resolution failed' };
    }

    if (addresses.length === 0) {
        return { kind: 'private', reason: 'no addresses' };
    }

    for (const a of addresses) {
        if (isPrivateIP(a.address)) {
            return { kind: 'private', reason: `private address ${a.address}` };
        }
    }

    return { addresses, kind: 'public', lookup: makePinnedLookup(addresses) };
}

// The returned function ignores its `hostname` argument and replays the
// already-validated addresses. Undici's `Agent` calls it via `net.connect`
// during socket setup with `all: true`, so the kernel never performs a
// second DNS lookup. Both callback shapes are supported (single result for
// `all: false`, array for `all: true`) since Node's LookupFunction is
// polymorphic via `options.all`.
function makePinnedLookup(addresses: LookupAddress[]): LookupFunction {
    return (_hostname, options, callback) => {
        const family = options.family;
        const candidates = family ? addresses.filter(a => a.family === family) : addresses;
        if (candidates.length === 0) {
            const err: NodeJS.ErrnoException = Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' });
            callback(err, '', 0);
            return;
        }
        // Node's LookupFunction typings require `null` (not `undefined`) for
        // the no-error callback slot, so disable the prefer-undefined rule here.
        if (options.all) {
            // eslint-disable-next-line unicorn/no-null
            callback(null, candidates);
            return;
        }
        const pick = candidates[0];
        // eslint-disable-next-line unicorn/no-null
        callback(null, pick.address, pick.family);
    };
}
