import type { AccountKindBuilder } from './shared.js';

export const buildCompressedNftPayload: AccountKindBuilder = context => {
    const entityFields: Record<string, string> = {};

    if (context.dasOutcome?.assetId) {
        entityFields.asset_id = context.dasOutcome.assetId;
    }
    if (context.dasOutcome?.owner) {
        entityFields.owner = context.dasOutcome.owner;
    }
    if (context.dasOutcome?.tree) {
        entityFields.tree = context.dasOutcome.tree;
    }

    return {
        entity: {
            kind: context.kind,
            ...entityFields,
        },
    };
};
