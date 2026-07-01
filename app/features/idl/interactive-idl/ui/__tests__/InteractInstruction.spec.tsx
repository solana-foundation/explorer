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

// jsdom doesn't implement ResizeObserver, which Radix Tooltip relies on once focused.
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
}

const walletMock = vi.hoisted(() => ({ connected: false, publicKey: null as PublicKey | null }));

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
    useWallet: () => walletMock,
}));

// Mock usePdas hook
vi.mock('../../model/use-pdas', () => ({
    usePdas: () => ({}),
}));

describe('InteractInstruction', () => {
    beforeEach(() => {
        walletMock.connected = false;
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
        it('should prefill ArgumentInput with default value for bool type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'isActive', rawType: 'bool', type: 'bool' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /isActive/i });
            expect(input).toHaveValue('false');
        });

        it('should prefill ArgumentInput with default value for string type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'message', rawType: 'string', type: 'string' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /message/i });
            expect(input).toHaveValue('default');
        });

        it('should prefill ArgumentInput with default value for pubkey type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'owner', type: 'pubkey' })],
            });

            renderInteractInstruction(instruction);

            const expectedValue = PublicKey.default.toString();
            const input = screen.getByRole('textbox', { name: /owner/i });
            expect(input).toHaveValue(expectedValue);
        });

        it('should prefill ArgumentInput with default value for f32 type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'price', type: 'f32' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /price/i });
            expect(input).toHaveValue('1.0');
        });

        it('should prefill ArgumentInput with default value for bytes type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'data', type: 'bytes' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /data/i });
            expect(input).toHaveValue('data');
        });

        it('should prefill multiple ArgumentInputs with correct default values', () => {
            const instruction = createInstruction({
                args: [
                    createArgField({ name: 'amount', type: 'u64' }),
                    createArgField({ name: 'isActive', type: 'bool' }),
                    createArgField({ name: 'owner', type: 'pubkey' }),
                ],
            });

            renderInteractInstruction(instruction);

            const amountInput = screen.getByRole('textbox', { name: /amount/i });
            const isActiveInput = screen.getByRole('textbox', { name: /isActive/i });
            const ownerInput = screen.getByRole('textbox', { name: /owner/i });

            expect(amountInput).toHaveValue('1');
            expect(isActiveInput).toHaveValue('false');
            expect(ownerInput).toHaveValue(PublicKey.default.toString());
        });

        it('should prefill ArgumentInput for wrapped types (option)', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'optionalAmount', rawType: { option: 'u64' }, type: 'option(u64)' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /optionalAmount/i });
            // Should extract inner type u64 and use its default
            expect(input).toHaveValue('1');
        });

        it('should prefill ArgumentInput for wrapped types (vec)', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'amounts', rawType: { vec: 'u8' }, type: 'vec(u8)' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /amounts/i });
            // Should extract inner type u8 and use its default
            expect(input).toHaveValue('1');
        });

        it('should prefill ArgumentInput for all numeric types', () => {
            const numericTypes = ['u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'i8', 'i16', 'i32', 'i64', 'i128', 'i256'];

            numericTypes.forEach(type => {
                const instruction = createInstruction({
                    args: [createArgField({ name: `value_${type}`, type })],
                });

                const { unmount } = renderInteractInstruction(instruction);

                const input = screen.getByRole('textbox', { name: new RegExp(`value_${type}`, 'i') });
                expect(input).toHaveValue('1');

                unmount();
            });
        });

        it('should prefill ArgumentInput with empty string for unknown types', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'customType', type: 'UnknownType' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /customType/i });
            expect(input).toHaveValue('');
        });

        it('should prefill ArgumentInput with default value for coption wrapped type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'coptionalValue', rawType: { coption: 'string' }, type: 'string' })],
            });

            renderInteractInstruction(instruction);

            const input = screen.getByRole('textbox', { name: /coptionalValue/i });
            // Should extract inner type string and use its default
            expect(input).toHaveValue('default');
        });

        it('should prefill ArgumentInput with default value for array wrapped type', () => {
            const instruction = createInstruction({
                args: [createArgField({ name: 'fixedArray', rawType: { array: ['u16', 5] }, type: 'array(u16, 5)' })],
            });

            renderInteractInstruction(instruction);

            // Array inputs may render multiple textboxes or a single one
            const inputs = screen.getAllByRole('textbox');
            // At least the first input should have the default value
            expect(inputs[0]).toHaveValue('1');
        });
    });

    describe('Actions', () => {
        it('should render both Execute and Simulate buttons', () => {
            renderInteractInstruction(createInstruction());
            expect(screen.getByRole('button', { name: /execute/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeInTheDocument();
        });

        it('should call onSimulateInstruction when Simulate is clicked', async () => {
            walletMock.connected = true;
            walletMock.publicKey = PublicKey.default;
            const onSimulate = vi.fn();
            const user = userEvent.setup();
            renderInteractInstruction(createInstruction(), { onSimulateInstruction: onSimulate });

            await user.click(screen.getByRole('button', { name: /simulate/i }));

            expect(onSimulate).toHaveBeenCalledTimes(1);
        });

        it('should call onExecuteInstruction when Execute is clicked', async () => {
            walletMock.connected = true;
            walletMock.publicKey = PublicKey.default;
            const onExecute = vi.fn();
            const user = userEvent.setup();
            renderInteractInstruction(createInstruction(), { onExecuteInstruction: onExecute });

            await user.click(screen.getByRole('button', { name: /execute/i }));

            expect(onExecute).toHaveBeenCalledTimes(1);
        });

        it('should disable both buttons while executing', () => {
            walletMock.connected = true;
            walletMock.publicKey = PublicKey.default;
            renderInteractInstruction(createInstruction(), { status: 'executing' });

            expect(screen.getByRole('button', { name: /execute/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeDisabled();
        });

        it('should disable both buttons while simulating', () => {
            walletMock.connected = true;
            walletMock.publicKey = PublicKey.default;
            renderInteractInstruction(createInstruction(), { status: 'simulating' });

            expect(screen.getByRole('button', { name: /execute/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeDisabled();
        });

        it('should disable both buttons when wallet is not connected', () => {
            walletMock.connected = false;
            renderInteractInstruction(createInstruction());

            expect(screen.getByRole('button', { name: /execute/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /simulate/i })).toBeDisabled();
        });
    });

    describe('simulate-before-execute toggle', () => {
        beforeEach(() => {
            walletMock.connected = true;
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
