import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildSysvarPayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
