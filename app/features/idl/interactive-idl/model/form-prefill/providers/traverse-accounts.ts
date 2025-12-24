import type { InstructionAccountData, InstructionData, NestedInstructionAccountsData } from '@entities/idl';

/**
 * Callback function called for each account during traversal.
 *
 * @param account - The account data (either regular or nested)
 * @param parentGroup - The parent account group if this is a nested account, undefined otherwise
 */
export type AccountTraversalCallback = (
    account: InstructionAccountData,
    parentGroup?: NestedInstructionAccountsData
) => void;

/**
 * Traverses all accounts in an instruction, calling the callback for each account.
 * Handles both regular accounts and nested account groups.
 *
 * @param instruction - The instruction data containing accounts to traverse
 * @param callback - Function called for each account with the account data and optional parent group
 */
export function traverseInstructionAccounts(instruction: InstructionData, callback: AccountTraversalCallback): void {
    for (const account of instruction.accounts) {
        if ('accounts' in account) {
            for (const nestedAccount of account.accounts) {
                callback(nestedAccount, account);
            }
        } else {
            callback(account);
        }
    }
}
