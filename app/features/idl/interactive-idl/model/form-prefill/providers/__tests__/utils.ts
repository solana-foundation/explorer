import type { InstructionAccountData, InstructionData, NestedInstructionAccountsData } from '@entities/idl';

type PlainAccountInput = string | Partial<InstructionAccountData>;

function toPlainAccount(input: PlainAccountInput): InstructionAccountData {
    if (typeof input === 'string') {
        return {
            docs: [],
            name: input,
            optional: false,
            signer: false,
        };
    }

    return {
        docs: [],
        name: '',
        optional: false,
        signer: false,
        ...input,
    };
}

export function createTestInstruction(accounts: PlainAccountInput[], name = 'testInstruction'): InstructionData {
    return {
        accounts: accounts.map(toPlainAccount),
        args: [],
        docs: [],
        name,
    };
}

export function createNestedTestAccount(
    groupName: string,
    accounts: PlainAccountInput[]
): NestedInstructionAccountsData {
    return {
        accounts: accounts.map(toPlainAccount),
        name: groupName,
    };
}
