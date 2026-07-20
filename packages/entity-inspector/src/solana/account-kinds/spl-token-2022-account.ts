import { type AccountKindBuilder, buildTokenEntityFields } from './shared.js';

export const buildSplToken2022AccountPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildTokenEntityFields(context.kind, context.account),
        },
    };
};
