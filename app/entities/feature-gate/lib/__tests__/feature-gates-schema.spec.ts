import { assert } from 'superstruct';

import FEATURES from '../../feature-gates.json';
import { FeatureGatesArraySchema } from '../feature-gates-schema';

describe('feature-gates-schema', () => {
    it('should accept the committed feature-gates.json', () => {
        expect(() => assert(FEATURES, FeatureGatesArraySchema)).not.toThrow();
    });
});
