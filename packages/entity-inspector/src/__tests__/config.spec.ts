import { describe, expect, it } from 'vitest';

import { SUPPORTED_CLUSTERS } from '../config.js';

describe('SUPPORTED_CLUSTERS', () => {
    it('should list the clusters the inspector can query', () => {
        expect(SUPPORTED_CLUSTERS).toEqual(['mainnet-beta', 'devnet', 'testnet', 'simd296']);
    });
});
