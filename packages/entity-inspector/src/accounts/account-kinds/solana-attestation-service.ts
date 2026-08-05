import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildSolanaAttestationServicePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
