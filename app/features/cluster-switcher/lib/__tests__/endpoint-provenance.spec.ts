import { clusterSelection } from '@entities/cluster';
import { Cluster, clusterUrl } from '@utils/cluster';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpointProvenance, isKnownEndpoint } from '../endpoint-provenance';

describe('endpointProvenance', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    // Absence is not trust: nothing to classify must never render as "known".
    it('should return undefined when there is no url', () => {
        expect(endpointProvenance(undefined)).toBeUndefined();
    });

    it.each([['not-a-url'], ['localhost:8899'], ['javascript:alert(1)'], ['']])(
        'should treat the unparseable value %j as unknown',
        value => {
            expect(endpointProvenance(value)).toBe('unknown');
        },
    );

    it.each([['http://localhost:8899'], ['http://127.0.0.1:8899']])('should treat %j as local', url => {
        expect(endpointProvenance(url)).toBe('local');
    });

    it('should treat a whitelisted host as known', () => {
        vi.stubEnv('NEXT_PUBLIC_WHITELISTED_RPCS', 'my-rpc.example.com');
        expect(endpointProvenance('https://my-rpc.example.com')).toBe('known');
    });

    it('should treat an endpoint the deployment ships with as known', () => {
        const shipped = clusterUrl(clusterSelection(Cluster.MainnetBeta));
        expect(endpointProvenance(shipped)).toBe('known');
    });

    it('should treat an arbitrary remote endpoint as unknown', () => {
        expect(endpointProvenance('https://nobody-vouches.example.org')).toBe('unknown');
    });
});

describe('isKnownEndpoint', () => {
    it('should be true for an endpoint the deployment ships with', () => {
        expect(isKnownEndpoint(clusterUrl(clusterSelection(Cluster.MainnetBeta)))).toBe(true);
    });

    it('should be false for an arbitrary remote endpoint', () => {
        expect(isKnownEndpoint('https://nobody-vouches.example.org')).toBe(false);
    });
});
