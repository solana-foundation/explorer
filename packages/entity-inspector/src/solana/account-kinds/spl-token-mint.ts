import { type AccountKindBuilder, buildMintOverviewFields } from './shared.js';

export const buildSplTokenMintPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildMintOverviewFields(context.account),
        },
    };
};
