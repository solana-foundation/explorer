import { AccountMeta, PublicKey } from '@solana/web3.js';
import { FlattenedIdlAccount } from '@utils/anchor';
import { describe, expect, it } from 'vitest';

import { type AnchorRow, buildAnchorRows, visibleAnchorRows } from '../build-anchor-rows';

const key = (): AccountMeta => ({ isSigner: false, isWritable: false, pubkey: PublicKey.unique() });
const account = (name: string, extra: Partial<FlattenedIdlAccount> = {}): FlattenedIdlAccount => ({
    isMut: false,
    isSigner: false,
    name,
    ...extra,
});
const groupHeader = (name: string, nestingLevel: number): FlattenedIdlAccount =>
    account(name, { isGroupHeader: true, nestingLevel });
const nestedAccount = (name: string, nestingLevel: number): FlattenedIdlAccount =>
    account(name, { isNested: true, nestingLevel });

describe('buildAnchorRows', () => {
    it('should produce one title-cased account row per key for a flat account list', () => {
        const rows = buildAnchorRows([key(), key()], [account('poolState'), account('tokenVault')]);

        expect(rows).toHaveLength(2);
        expect(rows.map(r => r.kind)).toEqual(['account', 'account']);
        expect(rows.map(r => (r.kind === 'account' ? r.name : undefined))).toEqual(['Pool State', 'Token Vault']);
    });

    it('should label keys beyond the named IDL accounts as Remaining Account #N', () => {
        const rows = buildAnchorRows([key(), key(), key()], [account('poolState')]);

        const names = rows.flatMap(r => (r.kind === 'account' ? [r.name] : []));
        expect(names).toEqual(['Pool State', 'Remaining Account #1', 'Remaining Account #2']);
    });

    it('should emit a group header before its nested accounts with a stable id', () => {
        const rows = buildAnchorRows(
            [key(), key(), key()],
            [
                groupHeader('withdrawAccounts', 0),
                nestedAccount('owner', 1),
                nestedAccount('reserve', 1),
                account('payer', { nestingLevel: 0 }),
            ],
        );

        expect(rows.map(r => r.kind)).toEqual(['group', 'account', 'account', 'account']);
        const group = rows[0] as Extract<AnchorRow, { kind: 'group' }>;
        expect(group).toMatchObject({ id: '0:withdrawAccounts', name: 'Withdraw Accounts', nestingLevel: 0 });
        expect(rows[1]).toMatchObject({ isNested: true, name: 'Owner', nestingLevel: 1 });
    });

    it('should give sibling groups with the same name and level distinct ids (so their collapse state is independent)', () => {
        const rows = buildAnchorRows(
            [key(), key()],
            [groupHeader('config', 0), nestedAccount('a', 1), groupHeader('config', 0), nestedAccount('b', 1)],
        );

        const groupIds = rows.flatMap(r => (r.kind === 'group' ? [r.id] : []));
        expect(groupIds).toHaveLength(2);
        expect(new Set(groupIds).size).toBe(2);
    });
});

describe('visibleAnchorRows', () => {
    const rows = buildAnchorRows(
        [key(), key(), key()],
        [
            groupHeader('withdrawAccounts', 0),
            nestedAccount('owner', 1),
            nestedAccount('reserve', 1),
            account('payer', { nestingLevel: 0 }),
        ],
    );

    it('should hide accounts nested under a collapsed group (default: all collapsed)', () => {
        const visible = visibleAnchorRows(rows, new Set());

        // group header stays; the two level-1 accounts are hidden; the level-0 payer remains.
        expect(visible.map(r => (r.kind === 'group' ? r.name : r.name))).toEqual(['Withdraw Accounts', 'Payer']);
    });

    it('should reveal nested accounts once the group is expanded', () => {
        const visible = visibleAnchorRows(rows, new Set(['0:withdrawAccounts']));

        expect(visible).toHaveLength(4);
        expect(visible.flatMap(r => (r.kind === 'account' ? [r.name] : []))).toEqual(['Owner', 'Reserve', 'Payer']);
    });
});
