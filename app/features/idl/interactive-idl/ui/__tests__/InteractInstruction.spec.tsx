/* eslint-disable no-restricted-syntax, no-restricted-globals -- test assertions use RegExp for pattern matching */
import { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { InstructionData } from '@entities/idl';
import { Accordion } from '@radix-ui/react-accordion';
import { PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InstructionStatus } from '../../model/use-instruction';
import { InteractInstruction } from '../InteractInstruction';

const walletMock = vi.hoisted(() => ({ canSign: false, publicKey: null as PublicKey | null }));

// Mock wallet state
vi.mock('@/app/providers/wallet/use-wallet', () => ({
    useWallet: () => walletMock,
}));

// Mock usePdas hook
vi.mock('../../model/use-pdas', () => ({
    usePdas: () => ({}),
}));

describe('InteractInstruction', () => {
    beforeEach(() => {
        walletMock.canSign = false;
        walletMock.publicKey = null;
    });

    // Helper to render InteractInstruction with accordion expanded
    const renderInteractInstruction = (
        instruction: InstructionData,
        props?: Partial<{
            onExecuteInstruction: ReturnType<typeof vi.fn>;
            onSimulateInstruction: ReturnType<typeof vi.fn>;
            status: InstructionStatus;
        }>,
    ) => {
        return render(
            <Accordion type="multiple" value={[instruction.name]}>
                <InteractInstruction
                    idl={undefined}
                    instruction={instruction}
                    onExecuteInstruction={
                        (props?.onExecuteInstruction ?? vi.fn()) as ComponentProps<
                            typeof InteractInstruction
                        >['onExecuteInstruction']
                    }
                    onSimulateInstruction={
                        (props?.onSimulateInstruction ?? vi.fn()) as ComponentProps<
                            typeof InteractInstruction
                        >['onSimulateInstruction']
                    }
                    status={props?.status ?? 'idle'}
                />
            </Accordion>,
        );
    };

    describe('Arguments prefilling', () => {
        it('should prefill multiple ArgumentInputs with correct default values', () => {
            const instruction = createInstruction({
                args: [
                    createArgField({ name: 'amount', type: 'u64' }),
                    createArgField({ name: 'isActive', type: 'bool' }),
                    createArgField({ name: 'owner', type: 'pubkey' }),
                    createArgField({ name: 'optionalAmount', rawType: { option: 'u64' }, type: 'option(u64)' }),
                ],
            });

            renderInteractInstruction(instruction);

            const amountInput = screen.getByRole('textbox', { name: /^amount/i });
            const isActiveInput = screen.getByRole('textbox', { name: /isActive/i });
            const ownerInput = screen.getByRole('textbox', { name: /owner/i });
            const optionalAmountInput = screen.getByRole('textbox', { name: /optionalAmount/i });

            expect(amountInput).toHaveValue('1');
            expect(isActiveInput).toHaveValue('false');
            expect(ownerInput).toHaveValue(PublicKey.default.toString());
            expect(optionalAmountInput).toHaveValue('1');
        });
    });

    describe('Actions', () => {
        it('should render both Execute and Simulate buttons', () => {
            renderInteractInstruction(createInstruction());
            expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeInTheDocument();
        });

        it.each([
            ['onSimulateInstruction', 'Simulate'],
            ['onExecuteInstruction', 'Execute'],
        ] as const)('should call %s when %s is clicked', async (handlerName, buttonLabel) => {
            walletMock.canSign = true;
            walletMock.publicKey = PublicKey.default;
            const handler = vi.fn();
            const user = userEvent.setup();
            renderInteractInstruction(createInstruction(), { [handlerName]: handler });

            await user.click(screen.getByRole('button', { name: new RegExp(buttonLabel, 'i') }));

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it.each(['executing', 'simulating'] as const)('should disable both buttons while %s', status => {
            walletMock.canSign = true;
            walletMock.publicKey = PublicKey.default;
            renderInteractInstruction(createInstruction(), { status });

            expect(screen.getByRole('button', { name: /execute/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeDisabled();
        });

        it('should disable both buttons when the wallet cannot sign', () => {
            walletMock.canSign = false;
            renderInteractInstruction(createInstruction());

            expect(screen.getByRole('button', { name: /execute/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeDisabled();
        });
    });

    describe('simulate-before-execute toggle', () => {
        beforeEach(() => {
            walletMock.canSign = true;
            walletMock.publicKey = PublicKey.default;
        });

        it('should hide the skipped-simulation warning and execute with simulate=true by default', async () => {
            const instruction = createInstruction();
            const onExecute = vi.fn();
            renderInteractInstruction(instruction, { onExecuteInstruction: onExecute });

            expect(screen.queryByTestId('simulate-skipped-warning')).not.toBeInTheDocument();
            expect(screen.getByTestId('simulate-before-execute-toggle')).toHaveAttribute('data-state', 'checked');

            fireEvent.click(screen.getByRole('button', { name: /execute/i }));
            await waitFor(() => expect(onExecute).toHaveBeenCalled());
            expect(onExecute).toHaveBeenCalledWith(instruction, expect.anything(), { simulate: true });
        });

        it('should show the warning and execute with simulate=false after disabling the toggle', async () => {
            const instruction = createInstruction();
            const onExecute = vi.fn();
            renderInteractInstruction(instruction, { onExecuteInstruction: onExecute });

            fireEvent.click(screen.getByTestId('simulate-before-execute-toggle'));

            expect(screen.getByTestId('simulate-skipped-warning')).toBeInTheDocument();
            expect(screen.getByTestId('simulate-before-execute-toggle')).toHaveAttribute('data-state', 'unchecked');

            fireEvent.click(screen.getByRole('button', { name: /execute/i }));
            await waitFor(() => expect(onExecute).toHaveBeenCalled());
            expect(onExecute).toHaveBeenCalledWith(instruction, expect.anything(), { simulate: false });
        });
    });
});

// Test helpers
function createInstruction(overrides?: Partial<InstructionData>): InstructionData {
    return {
        accounts: [],
        args: [],
        docs: [],
        name: 'testInstruction',
        ...overrides,
    };
}

function createArgField({ name, type, rawType }: { name: string; type: string; rawType?: IdlType }) {
    return {
        docs: [],
        name,
        rawType,
        type,
    };
}
