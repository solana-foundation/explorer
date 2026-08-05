import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildFeaturePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
