import type { AccountMeta, AccountRole, Address } from '@solana/kit';
import { capitalizeFirstLetter } from '@utils/index';

/**
 * The IDL name of the account at the same position. An IDL that nests accounts gives each name a depth,
 * and a group names the accounts nested after it without taking a position.
 */
export type AccountName = string | NestedAccountName;

type NestedAccountName = { name: string; depth: number; group: boolean };

export type AccountRow =
    | { kind: 'group'; id: string; label: string; depth: number }
    | { kind: 'account'; position: number; address: Address; role: AccountRole; label: string; depth: number };

export function labelAccounts(
    accounts: readonly Pick<AccountMeta, 'address' | 'role'>[],
    names: readonly AccountName[],
): AccountRow[] {
    const positioned = names.filter(name => !isGroup(name));
    const rows: AccountRow[] = [];
    let cursor = 0;
    accounts.forEach(({ address, role }, position) => {
        let next = names.at(cursor);
        while (next !== undefined && isGroup(next)) {
            // The index in `names` keeps two sibling groups with one name apart.
            rows.push({
                depth: next.depth,
                id: `${cursor}:${next.name}`,
                kind: 'group',
                label: capitalizeFirstLetter(next.name),
            });
            next = names.at(++cursor);
        }
        cursor++;
        const name = positioned.at(position);
        rows.push({
            address,
            depth: typeof name === 'object' ? name.depth : 0,
            kind: 'account',
            label: accountLabel(positioned, position),
            position,
            role,
        });
    });
    return rows;
}

function isGroup(name: AccountName): name is NestedAccountName {
    return typeof name === 'object' && name.group;
}

function accountLabel(names: readonly AccountName[], position: number): string {
    if (position >= names.length) {
        return remainingAccountLabel(position, names.length);
    }
    const name = names[position];
    const text = typeof name === 'string' ? name : name.name;
    return text ? capitalizeFirstLetter(text) : `Account #${position + 1}`;
}

function remainingAccountLabel(position: number, namedCount: number): string {
    return `Remaining Account #${position + 1 - namedCount}`;
}

/** A collapsed group hides the deeper rows after it, until a row at its own depth or above. */
export function visibleAccountRows(rows: readonly AccountRow[], expanded: ReadonlySet<string>): AccountRow[] {
    const visible: AccountRow[] = [];
    let hideBelow: number | undefined;
    for (const row of rows) {
        if (hideBelow !== undefined && row.depth > hideBelow) continue;
        hideBelow = row.kind === 'group' && !expanded.has(row.id) ? row.depth : undefined;
        visible.push(row);
    }
    return visible;
}
