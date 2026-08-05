import { NFTOKEN_ADDRESS } from '../../shared/constants.js';
import type { AccountKindBuilder } from './shared.js';

export const buildNftokenPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            owner_program: NFTOKEN_ADDRESS,
        },
    };
};
