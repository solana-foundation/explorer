import { type AccountKindBuilder, buildSplMultisigFields, buildTokenEntityFields } from './shared.js';

export const buildSplTokenMultisigPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildTokenEntityFields(context.kind, context.account),
            ...buildSplMultisigFields(context.account),
        },
    };
};
