import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildConfigPayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
