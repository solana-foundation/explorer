import _dns, { type LookupAddress } from 'dns';
import Address, { parse } from 'ipaddr.js';
import { type LookupFunction } from 'net';

import { Logger } from '@/app/shared/lib/logger';

const dns = _dns.promises;

// List of private IP ranges (CIDR notation)
const privateIPv4CIDRs = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16',
    '100.64.0.0/10',
    '0.0.0.0/8',
];

const privateIPv6CIDRs = ['::1/128', 'fc00::/7', 'fe80::/10', '::ffff:0:0/96'];

function ipInRange(ip: Address.IPv4 | Address.IPv6, cidr: string) {
    const [network, prefix] = cidr.split('/');
    const range = parse(network);
    return ip.match(range, parseInt(prefix, 10));
}

export function isPrivateIP(ip: string) {
    const isIPv4 = Address.IPv4.isIPv4(ip);
    const normalizedIP = parse(ip);

    let isMatchedRanges: boolean;
    if (isIPv4) {
        isMatchedRanges = privateIPv4CIDRs.some(cidr => ipInRange(normalizedIP, cidr));
    } else {
        isMatchedRanges = privateIPv6CIDRs.some(cidr => ipInRange(normalizedIP, cidr));
    }
    return isMatchedRanges;
}

export function isHTTPProtocol(url: URL) {
    return ['http:', 'https:'].includes(url.protocol);
}

function isLocalhostName(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '0' || hostname === '::1';
}

export type LookupResult =
    | { kind: 'public'; lookup: LookupFunction; addresses: LookupAddress[] }
    | { kind: 'private'; reason: string };

/**
 * Resolve a hostname once, validate every returned address against the private
 * IP ranges, and return a `lookup` function that always replays those same
 * pre-validated addresses. Passing this `lookup` into an undici `Agent` closes
 * the DNS-rebinding TOCTOU window: a malicious authoritative DNS server cannot
 * flip the answer between our validation and the kernel's `connect()`, because
 * the kernel never resolves the hostname again — it sees only the IP we
 * already approved.
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
        Logger.debug('[api:metadata-proxy] DNS resolution failed', { error, hostname });
        return { kind: 'private', reason: 'DNS resolution failed' };
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
        if (options.all) {
            callback(null, candidates);
            return;
        }
        const pick = candidates[0];
        callback(null, pick.address, pick.family);
    };
}
