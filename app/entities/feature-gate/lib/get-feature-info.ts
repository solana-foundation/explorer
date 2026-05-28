import FEATURES from '../feature-gates.json';
import type { FeatureInfoType } from '../types';

export function getFeatureInfo(address: string): FeatureInfoType | undefined {
    const index = FEATURES.findIndex(feature => feature.key === address);

    if (index === -1) return undefined;

    // feature-gates.json is validated against FeatureGatesArraySchema; the inferred
    // literal type is narrower than the runtime shape, so assert the domain type.
    return FEATURES[index] as FeatureInfoType;
}
