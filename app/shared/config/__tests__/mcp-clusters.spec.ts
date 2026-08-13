import { DEFAULT_CLUSTER, SUPPORTED_CLUSTERS } from '@explorer/entity-inspector';
import { describe, expect, it } from 'vitest';

import { MCP_ENABLED_CLUSTER_NAMES } from '../mcp-clusters';

describe('MCP_ENABLED_CLUSTER_NAMES', () => {
    // Enabling is opt-in, so a cluster the package adds stays off until it is listed here on purpose.
    it('should only enable clusters the inspector supports', () => {
        for (const clusterName of MCP_ENABLED_CLUSTER_NAMES) {
            expect(SUPPORTED_CLUSTERS, clusterName).toContain(clusterName);
        }
    });

    // Withholding it is legal, but then the advertised default silently becomes the first entry instead.
    it('should include the cluster the tool schema defaults to', () => {
        expect(MCP_ENABLED_CLUSTER_NAMES).toContain(DEFAULT_CLUSTER);
    });

    it('should enable each cluster exactly once', () => {
        expect(new Set(MCP_ENABLED_CLUSTER_NAMES).size).toBe(MCP_ENABLED_CLUSTER_NAMES.length);
    });
});
