import type { InstructionAccountData, InstructionData, NestedInstructionAccountsData } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useInstructionForm } from '../../../use-instruction-form';

type PlainAccountInput = string | Partial<InstructionAccountData>;

export function renderInstructionForm(instruction: InstructionData) {
    return renderHook(() => useInstructionForm({ instruction, onSubmit: vi.fn() })).result.current;
}

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

export function createTestInstruction(
    accounts: (PlainAccountInput | NestedInstructionAccountsData)[],
    name = 'testInstruction',
): InstructionData {
    return {
        accounts: accounts.map(account =>
            typeof account !== 'string' && 'accounts' in account ? account : toPlainAccount(account),
        ),
        args: [],
        docs: [],
        name,
    };
}

export function createNestedTestAccount(
    groupName: string,
    accounts: PlainAccountInput[],
): NestedInstructionAccountsData {
    return {
        accounts: accounts.map(toPlainAccount),
        name: groupName,
    };
}
