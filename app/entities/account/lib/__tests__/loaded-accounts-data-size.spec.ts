import { describe, expect, it } from 'vitest';

import { getLoadedAccountsDataSize } from '../loaded-accounts-data-size';

describe('getLoadedAccountsDataSize', () => {
    it('should charge each account 64 bytes on top of its data', () => {
        expect(getLoadedAccountsDataSize({ accountCount: 3, dataSize: 1_000 })).toBe(1_192);
    });
});
