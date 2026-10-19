import type { InstructionData } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { InteractInstructions } from '../InteractInstructions';

vi.mock('@/app/providers/wallet/use-wallet', () => ({
    useWallet: () => ({ canSign: true, publicKey: PublicKey.default }),
}));
vi.mock('../../model/use-pdas', () => ({ usePdas: () => ({}) }));

type OnExecute = ComponentProps<typeof InteractInstructions>['onExecuteInstruction'];

describe('InteractInstructions', () => {
    it('should send the arguments in the order of the current instruction after the instruction changes', async () => {
        const onExecute = vi.fn<OnExecute>(async () => undefined);
        const { rerender } = render(instructionList(transfer(['amount', 'limit']), onExecute));

        rerender(instructionList(transfer(['limit', 'amount']), onExecute));
        fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

        await waitFor(() => expect(onExecute).toHaveBeenCalled());
        const [, params] = onExecute.mock.lastCall ?? [];
        expect(Object.keys(params?.arguments ?? {})).toEqual(['transfer.limit', 'transfer.amount']);
    });

    it('should keep a typed argument when the instruction is rendered again unchanged', () => {
        const { rerender } = render(instructionList(transfer(['amount', 'limit']), vi.fn()));
        fireEvent.change(screen.getByRole('textbox', { name: 'amount' }), { target: { value: '42' } });

        rerender(instructionList(transfer(['amount', 'limit']), vi.fn()));

        expect(screen.getByRole('textbox', { name: 'amount' })).toHaveValue('42');
    });
});

function instructionList(instruction: InstructionData, onExecute: OnExecute) {
    return (
        <InteractInstructions
            idl={undefined}
            expandedSections={[instruction.name]}
            setExpandedSections={vi.fn()}
            instructions={[instruction]}
            onExecuteInstruction={onExecute}
            onSimulateInstruction={vi.fn(async () => undefined)}
        />
    );
}

function transfer(argNames: string[]): InstructionData {
    return {
        accounts: [],
        args: argNames.map(name => ({ docs: [], name, type: 'u64' })),
        docs: [],
        name: 'transfer',
    };
}
