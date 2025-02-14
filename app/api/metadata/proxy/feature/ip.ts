import _dns from 'dns';
import Address, { parse } from 'ipaddr.js';

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

const privateIPv6CIDRs = [
    '::1/128',
    'fc00::/7',
    'fe80::/10',
    '::ffff:0:0/96'
];

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
 *  Check for IP address to be in private rande
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
        const addresses = await dns.lookup(hostname, { all: true });

        for (const address of addresses) {
            if (isPrivateIP(address.address)) {
                return true;
          }
        }

        return false;
    } catch (error) {
        // write to console to track parsing error
        // might be a good one to log with Sentry
        console.debug(`Error processing URL ${uri.toString()}:`, error);
        return true;
    }
}
