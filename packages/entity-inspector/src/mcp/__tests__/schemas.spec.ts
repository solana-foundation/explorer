import { describe, expect, it } from 'vitest';

import { SUPPORTED_CLUSTERS } from '../../config.js';
import { defaultCluster, inspectEntityInputSchema } from '../schemas.js';

describe('inspectEntityInputSchema', () => {
    it('should accept every cluster by default', () => {
        const schema = inspectEntityInputSchema();

        for (const cluster of SUPPORTED_CLUSTERS) {
            expect(schema.parse({ cluster, identifier: 'abc' }).cluster, cluster).toBe(cluster);
        }
    });

    it('should reject a cluster the deployment has not enabled', () => {
        const schema = inspectEntityInputSchema(['mainnet-beta', 'devnet']);

        expect(() => schema.parse({ cluster: 'simd296', identifier: 'abc' })).toThrow();
    });

    it('should default to the enabled cluster when none is given', () => {
        const schema = inspectEntityInputSchema(['mainnet-beta', 'devnet']);

        expect(schema.parse({ identifier: 'abc' }).cluster).toBe('mainnet-beta');
    });
});

describe('defaultCluster', () => {
    it('should prefer mainnet-beta when it is enabled', () => {
        expect(defaultCluster(['devnet', 'mainnet-beta'])).toBe('mainnet-beta');
    });

    // Guards the schema's `.default()` from ever naming a value its own enum rejects.
    it('should fall back to the first cluster when mainnet-beta is withheld', () => {
        expect(defaultCluster(['testnet', 'devnet'])).toBe('testnet');
    });
});
