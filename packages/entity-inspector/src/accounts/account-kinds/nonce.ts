import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildNoncePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
