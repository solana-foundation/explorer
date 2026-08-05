import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildAddressLookupTablePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
