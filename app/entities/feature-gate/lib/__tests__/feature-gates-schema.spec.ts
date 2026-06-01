import { assert } from 'superstruct';

import FEATURES from '../../feature-gates.json';
import { FeatureGatesArraySchema, FeatureGateSchema } from '../feature-gates-schema';

describe('feature-gates-schema', () => {
    it('should accept the committed feature-gates.json', () => {
        expect(() => assert(FEATURES, FeatureGatesArraySchema)).not.toThrow();
    });

    it('should reject a row whose key is not a valid base58 address', () => {
        const malformed = { ...FEATURES[0], key: 'Activated Features' };
        expect(() => assert(malformed, FeatureGateSchema)).toThrow();
    });
});
