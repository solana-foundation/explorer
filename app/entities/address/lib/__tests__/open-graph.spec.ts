import { gen } from '@__fixtures__/gen';
import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { getAccountOgImageUrl, getAccountOpenGraph, getAccountPageUrl } from '../open-graph';

const ADDRESS = gen.address(1);
const BASE_URL = 'https://explorer.solana.com';

describe('getAccountOpenGraph', () => {
    it('should set type and url, the two tags whose absence stops Slack unfurling', () => {
        expect(getAccountOpenGraph(ADDRESS)).toMatchObject({
            type: 'website',
            url: `${BASE_URL}/address/${ADDRESS}`,
        });
    });

    it('should point the image at the og route with explicit 1200x630 dimensions', () => {
        expect(getAccountOpenGraph(ADDRESS)).toMatchObject({
            images: [{ alt: 'Solana Account', height: 630, url: `${BASE_URL}/og/account/${ADDRESS}`, width: 1200 }],
        });
    });

    it('should omit the cluster param on mainnet', () => {
        expect(getAccountOpenGraph(ADDRESS, Cluster.MainnetBeta)).toMatchObject({
            images: [{ url: `${BASE_URL}/og/account/${ADDRESS}` }],
            url: `${BASE_URL}/address/${ADDRESS}`,
        });
    });

    it('should emit the cluster param in both urls for a non-mainnet cluster', () => {
        expect(getAccountOpenGraph(ADDRESS, Cluster.Devnet)).toMatchObject({
            images: [{ url: `${BASE_URL}/og/account/${ADDRESS}?cluster=devnet` }],
            url: `${BASE_URL}/address/${ADDRESS}?cluster=devnet`,
        });
    });

    it('should expose the same image url the twitter card reuses', () => {
        expect(getAccountOgImageUrl(ADDRESS)).toBe(`${BASE_URL}/og/account/${ADDRESS}`);
        expect(getAccountOgImageUrl(ADDRESS, Cluster.Testnet)).toBe(
            `${BASE_URL}/og/account/${ADDRESS}?cluster=testnet`,
        );
    });

    it('should build the canonical page url with and without a cluster', () => {
        expect(getAccountPageUrl(ADDRESS)).toBe(`${BASE_URL}/address/${ADDRESS}`);
        expect(getAccountPageUrl(ADDRESS, Cluster.MainnetBeta)).toBe(`${BASE_URL}/address/${ADDRESS}`);
        expect(getAccountPageUrl(ADDRESS, Cluster.Devnet)).toBe(`${BASE_URL}/address/${ADDRESS}?cluster=devnet`);
    });
});
