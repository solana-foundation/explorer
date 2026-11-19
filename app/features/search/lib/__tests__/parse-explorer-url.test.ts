import { DEFAULT_ADDRESS, DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { parseExplorerUrl } from '../parse-explorer-url';

describe('parseExplorerUrl', () => {
    it.each([
        [
            'a Solscan account URL',
            `https://solscan.io/account/${DEFAULT_ADDRESS}`,
            { entity: 'Account', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'solscan.io', type: 'address' },
        ],
        [
            'a Solscan token URL',
            `https://solscan.io/token/${DEFAULT_ADDRESS}`,
            { entity: 'Token', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'solscan.io', type: 'address' },
        ],
        [
            'a Solscan transaction URL',
            `https://solscan.io/tx/${DEFAULT_SIGNATURE}`,
            { entity: 'Transaction', pathname: `/tx/${DEFAULT_SIGNATURE}`, source: 'solscan.io', type: 'tx' },
        ],
        [
            'a Solscan block URL',
            'https://solscan.io/block/300000000',
            { entity: 'Block', pathname: '/block/300000000', source: 'solscan.io', type: 'block' },
        ],
        [
            'a Solscan URL with the www prefix',
            `https://www.solscan.io/account/${DEFAULT_ADDRESS}`,
            { entity: 'Account', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'solscan.io', type: 'address' },
        ],
        [
            'a Solscan URL over http',
            `http://solscan.io/account/${DEFAULT_ADDRESS}`,
            { entity: 'Account', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'solscan.io', type: 'address' },
        ],
        [
            'an Orb Markets address URL',
            `https://orb.markets/address/${DEFAULT_ADDRESS}`,
            { entity: 'Address', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'orb.markets', type: 'address' },
        ],
        [
            'an Orb Markets transaction URL',
            `https://orb.markets/tx/${DEFAULT_SIGNATURE}`,
            { entity: 'Transaction', pathname: `/tx/${DEFAULT_SIGNATURE}`, source: 'orb.markets', type: 'tx' },
        ],
        [
            'an Orb Markets block URL',
            'https://orb.markets/block/300000000',
            { entity: 'Block', pathname: '/block/300000000', source: 'orb.markets', type: 'block' },
        ],
        [
            'an Orb Markets epoch URL',
            'https://orb.markets/epoch/500',
            { entity: 'Epoch', pathname: '/epoch/500', source: 'orb.markets', type: 'epoch' },
        ],
        [
            'an Orb Markets URL with the www prefix',
            `https://www.orb.markets/address/${DEFAULT_ADDRESS}`,
            { entity: 'Address', pathname: `/address/${DEFAULT_ADDRESS}`, source: 'orb.markets', type: 'address' },
        ],
    ])('should parse %s', (_description, url, expected) => {
        expect(parseExplorerUrl(url)).toEqual({ cluster: Cluster.Mainnet, ...expected });
    });

    it.each([
        [`https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=devnet`, Cluster.Devnet],
        [`https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=testnet`, Cluster.Testnet],
        [`https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=mainnet-beta`, Cluster.Mainnet],
        [`https://solscan.io/account/${DEFAULT_ADDRESS}?cluster=unknown`, Cluster.Mainnet],
        [`https://orb.markets/address/${DEFAULT_ADDRESS}?cluster=devnet`, Cluster.Devnet],
    ])('should resolve the cluster of %s', (url, cluster) => {
        expect(parseExplorerUrl(url)).toMatchObject({ cluster, pathname: `/address/${DEFAULT_ADDRESS}` });
    });

    it.each([
        `https://solscan.io/account/${DEFAULT_ADDRESS}/transfers`,
        `https://orb.markets/address/${DEFAULT_ADDRESS}/details`,
    ])('should ignore sub-paths after the identifier in %s', url => {
        expect(parseExplorerUrl(url)?.pathname).toBe(`/address/${DEFAULT_ADDRESS}`);
    });

    it.each([
        ['plain text', 'hello world'],
        ['a bare address', DEFAULT_ADDRESS],
        ['a bare number', '12345'],
        ['an unknown hostname', `https://example.com/account/${DEFAULT_ADDRESS}`],
        ['another chain explorer', 'https://etherscan.io/address/0xabc'],
        ['an unsupported protocol', `ftp://solscan.io/account/${DEFAULT_ADDRESS}`],
        ['a URL without a path', 'https://solscan.io'],
        ['a URL with the root path', 'https://solscan.io/'],
        ['an unrecognised entity segment', `https://solscan.io/validators/${DEFAULT_ADDRESS}`],
        ['a missing identifier', 'https://solscan.io/account'],
        ['an empty identifier', 'https://solscan.io/account/'],
        ['a whitespace-only identifier', 'https://solscan.io/account/%20%20'],
        ['a percent-encoded identifier', 'https://solscan.io/account/hello%20world'],
        ['a malformed percent-escape', 'https://solscan.io/account/%E0%A4%A'],
        ['an account path that escapes to another origin', 'https://solscan.io/account/..%5C%5Cexample.com%5C%25'],
        ['a transaction path that escapes to another origin', 'https://solscan.io/tx/..%5C%5Cexample.com'],
        ['an Orb Markets path that escapes to another origin', 'https://orb.markets/address/..%5C%5Cexample.com%5C%25'],
        ['a double-encoded dot segment', 'https://solscan.io/account/%252e%252e'],
        ['a double-encoded dot segment on a block route', 'https://orb.markets/block/%252e%252e'],
        ['an encoded slash', `https://solscan.io/account/${DEFAULT_ADDRESS}%2Fdef`],
        ['an encoded backslash', `https://solscan.io/account/${DEFAULT_ADDRESS}%5Cdef`],
        ['an encoded query delimiter', `https://solscan.io/account/${DEFAULT_ADDRESS}%3Fcluster=devnet`],
        ['an encoded fragment delimiter', `https://solscan.io/account/${DEFAULT_ADDRESS}%23fragment`],
        ['a non-address account identifier', 'https://solscan.io/account/abc'],
        ['an address on a transaction route', `https://solscan.io/tx/${DEFAULT_ADDRESS}`],
        ['a non-decimal block number', 'https://solscan.io/block/1e3'],
        ['a non-numeric epoch', 'https://orb.markets/epoch/abc'],
    ])('should return undefined for %s', (_description, input) => {
        expect(parseExplorerUrl(input)).toBeUndefined();
    });
});
