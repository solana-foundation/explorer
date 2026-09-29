import type { AccountMeta, AccountRole, Address } from '@solana/kit';
import { capitalizeFirstLetter } from '@utils/index';

type AccountRow = { address: Address; role: AccountRole; label: string };

export function labelAccounts(
    accounts: readonly Pick<AccountMeta, 'address' | 'role'>[],
    names: readonly string[],
): AccountRow[] {
    return accounts.map(({ address, role }, position) => ({ address, label: accountLabel(names, position), role }));
}

function accountLabel(names: readonly string[], position: number): string {
    if (position >= names.length) {
        return remainingAccountLabel(position, names.length);
    }
    const name = names[position];
    return name ? capitalizeFirstLetter(name) : `Account #${position + 1}`;
}

export function remainingAccountLabel(position: number, namedCount: number): string {
    return `Remaining Account #${position + 1 - namedCount}`;
}
