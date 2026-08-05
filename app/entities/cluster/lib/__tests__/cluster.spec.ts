import { describe, expect, it, vi } from 'vitest';

import { Cluster, type ServerCluster, serverClusterUrl } from '../cluster';

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
        // The compile error is the assertion — tsc flags an unused `@ts-expect-error` if this ever
        // type-checks. Asserted on the type, not on a call, so adding a `default:` branch to
        // `serverClusterUrl` cannot turn this into a false failure.
        const custom: Cluster = Cluster.Custom;
        // @ts-expect-error ServerCluster excludes Cluster.Custom.
        const asServerCluster: ServerCluster = custom;

        expect(asServerCluster).toBe(Cluster.Custom);
    });
});
