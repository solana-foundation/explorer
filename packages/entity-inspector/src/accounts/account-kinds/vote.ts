import { type AccountKindBuilder, buildKindOnlyPayload } from './shared.js';

export const buildVotePayload: AccountKindBuilder = context => buildKindOnlyPayload(context);
