import FEATURES from '../feature-gates.json';
import type { FeatureInfoType } from '../types';

export function getFeatureInfo(address: string): FeatureInfoType | undefined {
    const index = FEATURES.findIndex(feature => feature.key === address);

    if (index === -1) return undefined;

    // feature-gates.json is validated against FeatureGatesArraySchema; the raw JSON
    // infers `key: string`, so assert the domain type (whose `key` is branded
    // `Address`) via `unknown`. Imported directly rather than via the entity's
    // branded `FEATURE_GATES` re-export to avoid a barrel import cycle.
    return FEATURES[index] as unknown as FeatureInfoType;
}
