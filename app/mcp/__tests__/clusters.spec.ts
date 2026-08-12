import { SUPPORTED_CLUSTERS } from '@explorer/entity-inspector';
import { describe, expect, it } from 'vitest';

import { MCP_ENABLED_CLUSTERS } from '../clusters';

describe('MCP_ENABLED_CLUSTERS', () => {
    it('should only enable clusters the inspector supports', () => {
        for (const cluster of MCP_ENABLED_CLUSTERS) {
            expect(SUPPORTED_CLUSTERS, cluster).toContain(cluster);
        }
    });

    it('should include the cluster the tool schema defaults to', () => {
        expect(MCP_ENABLED_CLUSTERS).toContain('mainnet-beta');
    });

    // Enabling is opt-in, so a cluster the package adds stays off until it is listed here on purpose.
    it('should enable each cluster exactly once', () => {
        expect(new Set(MCP_ENABLED_CLUSTERS).size).toBe(MCP_ENABLED_CLUSTERS.length);
    });
});
