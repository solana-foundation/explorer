import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { parseExplorerUrl } from '../parse-explorer-url';

describe('parseExplorerUrl', () => {
    it('should return undefined for non-URL input', () => {
        expect(parseExplorerUrl('hello world')).toBeUndefined();
        expect(parseExplorerUrl('So11111111111111111111111111111111111111112')).toBeUndefined();
        expect(parseExplorerUrl('12345')).toBeUndefined();
    });

    it('should return undefined for unknown hostnames', () => {
        expect(parseExplorerUrl('https://example.com/account/abc')).toBeUndefined();
        expect(parseExplorerUrl('https://etherscan.io/address/0xabc')).toBeUndefined();
    });

    it('should return undefined for unsupported protocols', () => {
        expect(parseExplorerUrl('ftp://solscan.io/account/abc')).toBeUndefined();
    });

    it('should return undefined for missing path segments', () => {
        expect(parseExplorerUrl('https://solscan.io/')).toBeUndefined();
        expect(parseExplorerUrl('https://solscan.io')).toBeUndefined();
    });

    it('should return undefined for unrecognised entity segment', () => {
        expect(parseExplorerUrl('https://solscan.io/validators/abc')).toBeUndefined();
    });

    it('should return undefined for missing identifier', () => {
        expect(parseExplorerUrl('https://solscan.io/account')).toBeUndefined();
        expect(parseExplorerUrl('https://solscan.io/account/')).toBeUndefined();
    });

    it('should return undefined for whitespace-only identifier after decoding', () => {
        expect(parseExplorerUrl('https://solscan.io/account/%20%20')).toBeUndefined();
    });

    describe('Solscan', () => {
        it('should parse an account URL', () => {
            expect(parseExplorerUrl('https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E')).toEqual(
                {
                    cluster: Cluster.MainnetBeta,
                    entity: 'Account',
                    pathname: '/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E',
                    source: 'solscan.io',
                },
            );
        });

        it('should parse a token URL', () => {
            expect(parseExplorerUrl('https://solscan.io/token/So11111111111111111111111111111111111111112')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Token',
                pathname: '/address/So11111111111111111111111111111111111111112',
                source: 'solscan.io',
            });
        });

        it('should parse a transaction URL', () => {
            expect(parseExplorerUrl('https://solscan.io/tx/5abc123')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Transaction',
                pathname: '/tx/5abc123',
                source: 'solscan.io',
            });
        });

        it('should parse a block URL', () => {
            expect(parseExplorerUrl('https://solscan.io/block/300000000')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Block',
                pathname: '/block/300000000',
                source: 'solscan.io',
            });
        });

        it('should handle www prefix', () => {
            expect(
                parseExplorerUrl('https://www.solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E'),
            ).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Account',
                pathname: '/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E',
                source: 'solscan.io',
            });
        });

        it('should resolve devnet cluster', () => {
            const result = parseExplorerUrl(
                'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E?cluster=devnet',
            );
            expect(result?.cluster).toBe(Cluster.Devnet);
            expect(result?.pathname).toBe('/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E');
        });

        it('should resolve testnet cluster', () => {
            const result = parseExplorerUrl(
                'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E?cluster=testnet',
            );
            expect(result?.cluster).toBe(Cluster.Testnet);
        });

        it('should resolve explicit mainnet-beta cluster', () => {
            const result = parseExplorerUrl(
                'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E?cluster=mainnet-beta',
            );
            expect(result?.cluster).toBe(Cluster.MainnetBeta);
        });

        it('should default to MainnetBeta for unrecognised cluster values', () => {
            const result = parseExplorerUrl(
                'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E?cluster=unknown',
            );
            expect(result?.cluster).toBe(Cluster.MainnetBeta);
        });

        it('should ignore sub-paths after the identifier', () => {
            const result = parseExplorerUrl(
                'https://solscan.io/account/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E/transfers',
            );
            expect(result?.pathname).toBe('/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E');
        });

        it('should decode percent-encoded identifiers', () => {
            const result = parseExplorerUrl('https://solscan.io/account/hello%20world');
            expect(result?.pathname).toBe('/address/hello world');
        });

        it('should accept http protocol', () => {
            expect(parseExplorerUrl('http://solscan.io/account/abc')).toBeDefined();
        });
    });

    describe('Orb Markets', () => {
        it('should parse an address URL', () => {
            expect(
                parseExplorerUrl('https://orb.markets/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E'),
            ).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Address',
                pathname: '/address/AU971DrPyhhrpRnmEBp5pDTWL2ny7nofb5vYBjDJkR2E',
                source: 'orb.markets',
            });
        });

        it('should parse a transaction URL', () => {
            expect(parseExplorerUrl('https://orb.markets/tx/5abc123')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Transaction',
                pathname: '/tx/5abc123',
                source: 'orb.markets',
            });
        });

        it('should parse a block URL', () => {
            expect(parseExplorerUrl('https://orb.markets/block/300000000')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Block',
                pathname: '/block/300000000',
                source: 'orb.markets',
            });
        });

        it('should parse an epoch URL', () => {
            expect(parseExplorerUrl('https://orb.markets/epoch/500')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Epoch',
                pathname: '/epoch/500',
                source: 'orb.markets',
            });
        });

        it('should handle www prefix', () => {
            expect(parseExplorerUrl('https://www.orb.markets/address/abc')).toEqual({
                cluster: Cluster.MainnetBeta,
                entity: 'Address',
                pathname: '/address/abc',
                source: 'orb.markets',
            });
        });

        it('should resolve devnet cluster', () => {
            const result = parseExplorerUrl('https://orb.markets/address/abc?cluster=devnet');
            expect(result?.cluster).toBe(Cluster.Devnet);
        });

        it('should ignore sub-paths after the identifier', () => {
            const result = parseExplorerUrl('https://orb.markets/address/abc/details');
            expect(result?.pathname).toBe('/address/abc');
        });
    });
});
