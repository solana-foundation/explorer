import { FlattenedIdlAccount } from '@utils/anchor';
import { describe, expect, it } from 'vitest';

import { anchorAccountNames } from '../anchor-account-names';

const account = (name: string, extra: Partial<FlattenedIdlAccount> = {}): FlattenedIdlAccount => ({
    isMut: false,
    isSigner: false,
    name,
    ...extra,
});

describe('anchorAccountNames', () => {
    it('should title-case each name', () => {
        expect(anchorAccountNames([account('poolState'), account('tokenVault')])).toEqual([
            { depth: 0, group: false, name: 'Pool State' },
            { depth: 0, group: false, name: 'Token Vault' },
        ]);
    });

    it('should keep the depth of a group and of its nested accounts', () => {
        const names = anchorAccountNames([
            account('withdrawAccounts', { isGroupHeader: true, nestingLevel: 0 }),
            account('owner', { isNested: true, nestingLevel: 1 }),
        ]);

        expect(names).toEqual([
            { depth: 0, group: true, name: 'Withdraw Accounts' },
            { depth: 1, group: false, name: 'Owner' },
        ]);
    });

    // A self-CPI event names its one account without a nesting level.
    it('should put an account without a nesting level at the top level', () => {
        expect(anchorAccountNames([account('eventAuthority')])).toEqual([
            { depth: 0, group: false, name: 'Event Authority' },
        ]);
    });
});
