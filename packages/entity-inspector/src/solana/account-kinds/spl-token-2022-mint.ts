import { asRecord, asString } from '../parse-helpers.js';
import type { NormalizedAccountInfo } from '../types.js';
import { type AccountKindBuilder, buildMintOverviewFields } from './shared.js';

function extractExtensions(account: NormalizedAccountInfo): unknown[] | null {
    const parsedInfo = asRecord(asRecord(account.parsedData)?.info);
    const rawExtensions = parsedInfo?.extensions;

    if (!Array.isArray(rawExtensions) || rawExtensions.length === 0) {
        return null;
    }

    const parsed = rawExtensions.flatMap((entry: unknown) => {
        const rec = asRecord(entry);
        const extensionType = asString(rec?.extension);
        if (!extensionType) {
            return [];
        }
        return [{ extension: extensionType, state: rec?.state ?? null }];
    });

    return parsed.length > 0 ? parsed : null;
}

export const buildSplToken2022MintPayload: AccountKindBuilder = context => {
    return {
        entity: {
            kind: context.kind,
            ...buildMintOverviewFields(context.account),
            extensions: extractExtensions(context.account),
        },
    };
};
