import _dns from 'dns';
import Address, { parse } from 'ipaddr.js';

import Logger from '@/app/utils/logger';

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

/**
 *  Check if an IP is in a CIDR block
 */
function ipInRange(ip: Address.IPv4 | Address.IPv6, cidr: string) {
    const [network, prefix] = cidr.split('/');
    const range = parse(network);
    return ip.match(range, parseInt(prefix, 10));
}

/**
 *  Check if an IP falls within a private range
 */
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

export function isLocalhost(url: URL) {
    const { hostname } = url;
    return hostname === 'localhost' || hostname === '0' || hostname === '::1';
}

/**
 *  Check for IP address to be in private range
 */
export async function checkURLForPrivateIP(uri: URL | string) {
    try {
        let url: URL;
        if (uri instanceof URL) {
            url = uri;
        } else {
            url = new URL(uri);
        }

        // Ensure the protocol is only HTTP or HTTPS
        if (!isHTTPProtocol(url)) {
            return true;
        }

        const { hostname } = url;

        // Block localhost explicitly
        if (isLocalhost(url)) {
            return true;
        }

        // Resolve DNS and check against private IP ranges
        // Enrich type as there are cases when addresses are undefined which is against the original DNS's types
        type LookupAddressResult = Awaited<ReturnType<typeof dns.lookup>>;
        const addresses: LookupAddressResult | LookupAddressResult[] | undefined = await dns.lookup(hostname, {
            all: true,
        });

        if (addresses === undefined) return true;

        if (Array.isArray(addresses)) {
            for (const address of addresses) {
                if (isPrivateIP(address.address)) {
                    return true;
                }
            }
        } else {
            const singleResult = addresses as unknown as LookupAddressResult;
            return isPrivateIP(singleResult.address);
        }

        return false;
    } catch (error) {
        Logger.debug(`Debug: error while processing URL ${uri.toString()}:`, error);
        return true;
    }
}
