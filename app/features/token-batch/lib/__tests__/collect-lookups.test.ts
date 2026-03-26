import { describe, expect, it } from 'vitest';

import type { ParsedSubInstruction } from '../batch-parser';
import { collectLookups } from '../collect-lookups';
import { makeAccount, makeTransferCheckedData } from './test-utils';

describe('collectLookups', () => {
    it('should return empty array for no sub-instructions', () => {
        expect(collectLookups([])).toEqual([]);
    });

    it('should skip types that do not need decimal lookup', () => {
        const subIxs = [
            makeSub({ data: makeTransferCheckedData(100n, 6), index: 0, typeName: 'TransferChecked' }, 4),
            makeSub({ data: new Uint8Array([9]), index: 1, typeName: 'CloseAccount' }),
            makeSub({ index: 2, typeName: 'SetAuthority' }),
        ];
        expect(collectLookups(subIxs)).toEqual([]);
    });

    it('should use source (index 0) for Transfer and mark as token account', () => {
        const source = makeAccount();
        const sub = makeSub({
            accounts: [source, makeAccount(), makeAccount(false, true)],
            index: 0,
            typeName: 'Transfer',
        });

        const lookups = collectLookups([sub]);

        expect(lookups).toEqual([{ kind: 'tokenAccount', subIndex: 0, tokenAccountAddress: source.pubkey.toBase58() }]);
    });

    it('should use source (index 0) for Approve and mark as token account', () => {
        const source = makeAccount();
        const sub = makeSub({
            accounts: [source, makeAccount(), makeAccount(false, true)],
            index: 0,
            typeName: 'Approve',
        });

        const lookups = collectLookups([sub]);

        expect(lookups).toEqual([{ kind: 'tokenAccount', subIndex: 0, tokenAccountAddress: source.pubkey.toBase58() }]);
    });

    it('should use mint (index 0) for MintTo and mark as direct mint', () => {
        const mint = makeAccount();
        const sub = makeSub({
            accounts: [mint, makeAccount(), makeAccount(false, true)],
            index: 0,
            typeName: 'MintTo',
        });

        const lookups = collectLookups([sub]);

        expect(lookups).toEqual([{ kind: 'mint', mintAddress: mint.pubkey.toBase58(), subIndex: 0 }]);
    });

    it('should use mint (index 1) for Burn and mark as direct mint', () => {
        const account = makeAccount();
        const mint = makeAccount();
        const sub = makeSub({
            accounts: [account, mint, makeAccount(false, true)],
            index: 0,
            typeName: 'Burn',
        });

        const lookups = collectLookups([sub]);

        expect(lookups).toEqual([{ kind: 'mint', mintAddress: mint.pubkey.toBase58(), subIndex: 0 }]);
    });

    it('should collect lookups from mixed sub-instructions', () => {
        const source = makeAccount();
        const mint = makeAccount();
        const subIxs = [
            makeSub({ accounts: [source, makeAccount(), makeAccount()], index: 0, typeName: 'Transfer' }),
            makeSub({ index: 1, typeName: 'CloseAccount' }),
            makeSub({ accounts: [mint, makeAccount(), makeAccount()], index: 2, typeName: 'MintTo' }),
        ];

        const lookups = collectLookups(subIxs);

        expect(lookups).toHaveLength(2);
        expect(lookups[0]).toMatchObject({ kind: 'tokenAccount', subIndex: 0 });
        expect(lookups[1]).toMatchObject({ kind: 'mint', subIndex: 2 });
    });
});

function makeSub(
    overrides: Partial<ParsedSubInstruction> & Pick<ParsedSubInstruction, 'typeName'>,
    accountCount = 3,
): ParsedSubInstruction {
    return {
        accounts: Array.from({ length: accountCount }, () => makeAccount()),
        data: new Uint8Array([0]),
        discriminator: 0,
        index: 0,
        ...overrides,
    };
}
