import { type AccountKindBuilder, buildSplMultisigFields, buildTokenEntityFields } from './shared.js';

export const buildSplToken2022MultisigPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildTokenEntityFields(context.kind, context.account),
            ...buildSplMultisigFields(context.account),
        },
    };
};
