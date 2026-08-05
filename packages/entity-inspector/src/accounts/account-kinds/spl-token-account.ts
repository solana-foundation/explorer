import { type AccountKindBuilder, buildTokenEntityFields } from './shared.js';

export const buildSplTokenAccountPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildTokenEntityFields(context.kind, context.account),
        },
    };
};
