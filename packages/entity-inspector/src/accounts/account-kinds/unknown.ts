import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildUnknownPayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
