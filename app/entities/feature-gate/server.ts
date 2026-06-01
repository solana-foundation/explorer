import featureGatesJson from './feature-gates.json';
import type { FeatureGate } from './lib/feature-gates-schema';

// `feature-gates.json` is validated against `FeatureGatesArraySchema` by the
// schema test, so its `key`s are guaranteed base58 addresses; the raw JSON
// import infers `key: string`, so cast once here to the branded read type
// rather than at every consumer.
export const FEATURE_GATES = featureGatesJson as unknown as FeatureGate[];

export { getFeatureInfo } from './lib/get-feature-info';
export { FeatureGatesArraySchema } from './lib/feature-gates-schema';
export type { FeatureGate, FeatureGateDraft } from './lib/feature-gates-schema';
export type { FeatureInfoType } from './types';
