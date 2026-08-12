import { SUPPORTED_CLUSTERS } from '@explorer/entity-inspector';
import { describe, expect, it } from 'vitest';

import { MCP_SUPPORTED_CLUSTERS } from '../constants';

describe('mcp-landing constants', () => {
    // Drift canary: the advertised list is a restated subset, so a rename or removal upstream must not go unnoticed.
    it('should only advertise clusters the inspector supports', () => {
        for (const cluster of MCP_SUPPORTED_CLUSTERS) {
            expect(SUPPORTED_CLUSTERS, cluster).toContain(cluster);
        }
    });

    it('should not advertise simd296 yet', () => {
        expect(MCP_SUPPORTED_CLUSTERS).not.toContain('simd296');
    });
});
