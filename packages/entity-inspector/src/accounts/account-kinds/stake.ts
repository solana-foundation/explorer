import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildStakePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
