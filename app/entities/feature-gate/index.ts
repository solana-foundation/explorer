import featureGatesJson from './feature-gates.json';
import type { FeatureGate } from './lib/feature-gates-schema';

// See server.ts: validated by the schema test, so cast the raw JSON (inferred
// `key: string`) once to the branded read type rather than at every consumer.
export const FEATURE_GATES = featureGatesJson as unknown as FeatureGate[];

export { getFeatureInfo } from './lib/get-feature-info';
export { FeatureGatesArraySchema } from './lib/feature-gates-schema';
export { useFeatureInfo } from './model/use-feature-info';
export type { FeatureGate, FeatureGateDraft } from './lib/feature-gates-schema';
export type { FeatureInfoType } from './types';
