import type { InstructionAccountData, InstructionData, NestedInstructionAccountsData } from '@entities/idl';
import { describe, expect, it, vi } from 'vitest';

import { traverseInstructionAccounts } from '../traverse-accounts';

describe('traverseInstructionAccounts', () => {
    it('should traverse regular accounts without parent group', () => {
        const account1: InstructionAccountData = { docs: [], name: 'payer', signer: true, writable: true };
        const account2: InstructionAccountData = { docs: [], name: 'systemProgram' };

        const instruction: InstructionData = {
            accounts: [account1, account2],
            args: [],
            docs: [],
            name: 'initialize',
        };

        const callback = vi.fn();
        traverseInstructionAccounts(instruction, callback);

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, account1);
        expect(callback).toHaveBeenNthCalledWith(2, account2);
    });

    it('should traverse nested accounts with parent group', () => {
        const regularAccount: InstructionAccountData = { docs: [], name: 'payer', signer: true };
        const nestedAccount1: InstructionAccountData = { docs: [], name: 'source' };
        const nestedAccount2: InstructionAccountData = { docs: [], name: 'destination' };

        const nestedGroup: NestedInstructionAccountsData = {
            accounts: [nestedAccount1, nestedAccount2],
            name: 'transferAccounts',
        };

        const anotherRegularAccount: InstructionAccountData = { docs: [], name: 'systemProgram' };

        const instruction: InstructionData = {
            accounts: [regularAccount, nestedGroup, anotherRegularAccount],
            args: [],
            docs: [],
            name: 'transfer',
        };

        const callback = vi.fn();
        traverseInstructionAccounts(instruction, callback);

        expect(callback).toHaveBeenCalledTimes(4);
        expect(callback).toHaveBeenNthCalledWith(1, regularAccount);
        expect(callback).toHaveBeenNthCalledWith(2, nestedAccount1, nestedGroup);
        expect(callback).toHaveBeenNthCalledWith(3, nestedAccount2, nestedGroup);
        expect(callback).toHaveBeenNthCalledWith(4, anotherRegularAccount);
    });

    it('should handle empty accounts array', () => {
        const instruction: InstructionData = {
            accounts: [],
            args: [],
            docs: [],
            name: 'noAccounts',
        };

        const callback = vi.fn();
        traverseInstructionAccounts(instruction, callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should handle nested group with empty accounts', () => {
        const emptyGroup: NestedInstructionAccountsData = {
            accounts: [],
            name: 'emptyGroup',
        };

        const instruction: InstructionData = {
            accounts: [emptyGroup],
            args: [],
            docs: [],
            name: 'withEmptyGroup',
        };

        const callback = vi.fn();
        traverseInstructionAccounts(instruction, callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should preserve account properties in callback', () => {
        const account: InstructionAccountData = {
            docs: ['Account documentation'],
            name: 'tokenAccount',
            optional: true,
            pda: true,
            signer: false,
            writable: true,
        };

        const instruction: InstructionData = {
            accounts: [account],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const callback = vi.fn();
        traverseInstructionAccounts(instruction, callback);

        expect(callback).toHaveBeenCalledWith(account);
        const receivedAccount = callback.mock.calls[0][0] as InstructionAccountData;
        expect(receivedAccount.docs).toEqual(['Account documentation']);
        expect(receivedAccount.name).toBe('tokenAccount');
        expect(receivedAccount.writable).toBe(true);
        expect(receivedAccount.signer).toBe(false);
        expect(receivedAccount.optional).toBe(true);
        expect(receivedAccount.pda).toBe(true);
    });
});
