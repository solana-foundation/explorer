import { AccountRole, address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { labelAccounts } from '../model/accounts';

const A = address('2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4');
const B = address('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

describe('labelAccounts', () => {
    it('should capitalize each IDL name and keep the address and role', () => {
        expect(labelAccounts([{ address: A, role: AccountRole.WRITABLE_SIGNER }], ['programData'])).toEqual([
            { address: A, label: 'ProgramData', role: AccountRole.WRITABLE_SIGNER },
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
});
