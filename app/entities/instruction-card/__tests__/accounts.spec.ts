import { AccountRole, address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { type AccountName, labelAccounts, visibleAccountRows } from '../model/accounts';

const A = address('2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4');
const B = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

describe('labelAccounts', () => {
    it('should capitalize each IDL name and keep the address and role', () => {
        expect(labelAccounts([{ address: A, role: AccountRole.WRITABLE_SIGNER }], ['programData'])).toEqual([
            {
                address: A,
                depth: 0,
                kind: 'account',
                label: 'ProgramData',
                position: 0,
                role: AccountRole.WRITABLE_SIGNER,
            },
        ]);
    });

    it('should label two accounts that share one address by their own names', () => {
        const rows = labelAccounts(
            [
                { address: A, role: AccountRole.READONLY },
                { address: A, role: AccountRole.WRITABLE },
            ],
            ['payer', 'sourceAccount'],
        );

        expect(rows.map(row => row.label)).toEqual(['Payer', 'SourceAccount']);
    });

    it('should label an empty-named account by its position', () => {
        const rows = labelAccounts(
            [
                { address: A, role: AccountRole.READONLY },
                { address: B, role: AccountRole.READONLY },
            ],
            ['buffer', ''],
        );

        expect(rows.map(row => row.label)).toEqual(['Buffer', 'Account #2']);
    });

    it('should count the accounts past the last name as remaining accounts', () => {
        const rows = labelAccounts(
            [
                { address: A, role: AccountRole.READONLY },
                { address: B, role: AccountRole.READONLY },
                { address: A, role: AccountRole.READONLY },
            ],
            ['buffer'],
        );

        expect(rows.map(row => row.label)).toEqual(['Buffer', 'Remaining Account #1', 'Remaining Account #2']);
    });

    it('should put a group before its nested accounts and give the group no position', () => {
        const rows = labelAccounts(readonlyAccounts(3), WITHDRAW_NAMES);

        expect(rows.map(row => [row.kind, row.label, row.depth])).toEqual([
            ['group', 'Withdraw Accounts', 0],
            ['account', 'Owner', 1],
            ['account', 'Reserve', 1],
            ['account', 'Payer', 0],
        ]);
        expect(rows.flatMap(row => (row.kind === 'account' ? [row.position] : []))).toEqual([0, 1, 2]);
    });

    it('should count only the accounts with a name before the remaining accounts', () => {
        const rows = labelAccounts(readonlyAccounts(3), [group('config', 0), nested('owner', 1)]);

        expect(rows.map(row => row.label)).toEqual(['Config', 'Owner', 'Remaining Account #1', 'Remaining Account #2']);
    });

    it('should give two sibling groups with one name their own ids', () => {
        const rows = labelAccounts(readonlyAccounts(2), [
            group('config', 0),
            nested('a', 1),
            group('config', 0),
            nested('b', 1),
        ]);

        const ids = rows.flatMap(row => (row.kind === 'group' ? [row.id] : []));
        expect(new Set(ids).size).toBe(2);
    });
});

describe('visibleAccountRows', () => {
    const rows = labelAccounts(readonlyAccounts(3), WITHDRAW_NAMES);
    const groupId = rows[0].kind === 'group' ? rows[0].id : '';

    it('should hide the accounts nested under a collapsed group', () => {
        expect(visibleAccountRows(rows, new Set()).map(row => row.label)).toEqual(['Withdraw Accounts', 'Payer']);
    });

    it('should show the nested accounts of an expanded group', () => {
        expect(visibleAccountRows(rows, new Set([groupId])).map(row => row.label)).toEqual([
            'Withdraw Accounts',
            'Owner',
            'Reserve',
            'Payer',
        ]);
    });
});

const WITHDRAW_NAMES: AccountName[] = [
    group('Withdraw Accounts', 0),
    nested('owner', 1),
    nested('reserve', 1),
    'payer',
];

function group(name: string, depth: number): AccountName {
    return { depth, group: true, name };
}

function nested(name: string, depth: number): AccountName {
    return { depth, group: false, name };
}

function readonlyAccounts(count: number) {
    return Array.from({ length: count }, () => ({ address: A, role: AccountRole.READONLY }));
}
