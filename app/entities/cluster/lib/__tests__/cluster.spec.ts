import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    Cluster,
    type ClusterSelection,
    clusterSelection,
    clusterUrl,
    modifyUrl,
    type ServerCluster,
    serverClusterUrl,
} from '../cluster';
import { DEFAULT_CUSTOM_URL, rpcEndpoint } from '../rpc-endpoint';

describe('ClusterSelection', () => {
    it('should refuse to pair an endpoint with a cluster that would ignore it', () => {
        // Asserted on the type: an unused `@ts-expect-error` is itself a tsc failure, so this breaks if
        // the pairing is loosened. Only Custom resolves to a supplied endpoint.
        // @ts-expect-error Only the Custom arm carries an endpoint.
        const wrong: ClusterSelection = { cluster: Cluster.Devnet, endpoint: rpcEndpoint('https://x.example') };

        expect(wrong.cluster).toBe(Cluster.Devnet);
    });

    it('should require an endpoint on the Custom cluster', () => {
        // The other half: Custom with nothing to connect to leaves each consumer inventing a fallback.
        // @ts-expect-error The Custom arm has no endpoint-less form.
        const wrong: ClusterSelection = { cluster: Cluster.Custom };

        expect(wrong.cluster).toBe(Cluster.Custom);
    });
});

describe('modifyUrl', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return the url unchanged when hostname is localhost', () => {
        vi.stubGlobal('location', { hostname: 'localhost' });

        expect(modifyUrl('https://api.mainnet.solana.com')).toBe('https://api.mainnet.solana.com');
        expect(modifyUrl('https://api.devnet.solana.com')).toBe('https://api.devnet.solana.com');
    });

    it('should replace "api" with "explorer-api" when hostname is not localhost', () => {
        vi.stubGlobal('location', { hostname: 'explorer.solana.com' });

        expect(modifyUrl('https://api.mainnet.solana.com')).toBe('https://explorer-api.mainnet.solana.com');
        expect(modifyUrl('https://api.devnet.solana.com')).toBe('https://explorer-api.devnet.solana.com');
    });

    it('should return the url unchanged when it has no "api" and hostname is not localhost', () => {
        vi.stubGlobal('location', { hostname: 'explorer.solana.com' });

        expect(modifyUrl('https://simd-0296.surfnet.dev:8899')).toBe('https://simd-0296.surfnet.dev:8899');
    });
});

describe('clusterUrl', () => {
    it('should resolve a Custom selection to its endpoint', () => {
        expect(clusterUrl(clusterSelection(Cluster.Custom, 'http://localhost:8900'))).toBe('http://localhost:8900');
    });

    it('should resolve every known cluster to its own endpoint, ignoring any custom URL', () => {
        const clusters: ServerCluster[] = [Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet, Cluster.Simd296];

        for (const cluster of clusters) {
            const url = clusterUrl({ cluster });
            expect(() => new URL(url)).not.toThrow();
            expect(url).not.toBe('http://localhost:8900');
        }
    });
});

describe('clusterSelection', () => {
    it('should drop a custom URL passed for a cluster that cannot use one', () => {
        // Tests, stories and raw query params supply the two unpaired; they are paired here, once.
        expect(clusterSelection(Cluster.Devnet, 'http://localhost:8900')).toEqual({ cluster: Cluster.Devnet });
    });

    it('should fall back to the default endpoint for a Custom cluster with no URL', () => {
        expect(clusterSelection(Cluster.Custom).endpoint?.href).toBe(DEFAULT_CUSTOM_URL);
    });

    it('should throw on a Custom cluster whose URL is not an endpoint', () => {
        // A literal that cannot parse describes a state the app can never reach, so it fails loudly
        // rather than resolving to something plausible.
        expect(() => clusterSelection(Cluster.Custom, 'localhost:8899')).toThrow();
    });
});

describe('serverClusterUrl', () => {
    it('should resolve each non-custom cluster to its own valid endpoint', () => {
        const clusters: ServerCluster[] = [Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet, Cluster.Simd296];
        const urls = clusters.map(serverClusterUrl);

        for (const url of urls) {
            expect(() => new URL(url)).not.toThrow();
        }
        expect(new Set(urls).size).toBe(urls.length);
    });

    it('should prefer the server env var over the public default', () => {
        vi.stubEnv('DEVNET_RPC_URL', 'https://private.devnet.example/rpc');
        expect(serverClusterUrl(Cluster.Devnet)).toBe('https://private.devnet.example/rpc');
        vi.unstubAllEnvs();
    });

    it('should exclude Custom from ServerCluster so the server cannot resolve a client URL', () => {
        // The compile error is the assertion. On the type, not on a call, so adding a `default:` branch
        // to `serverClusterUrl` cannot turn this into a false failure.
        const custom: Cluster = Cluster.Custom;
        // @ts-expect-error ServerCluster excludes Cluster.Custom.
        const asServerCluster: ServerCluster = custom;

        expect(asServerCluster).toBe(Cluster.Custom);
    });
});
