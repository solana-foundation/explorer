import type { AccountName } from '@entities/instruction-card';
import type { FlattenedIdlAccount } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';

export function anchorAccountNames(accounts: readonly FlattenedIdlAccount[]): AccountName[] {
    return accounts.map(({ name, nestingLevel = 0, isGroupHeader = false }) => ({
        depth: nestingLevel,
        group: isGroupHeader,
        name: camelToTitleCase(name),
    }));
}
