import { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { InstructionData } from '@entities/idl';
import { Accordion } from '@radix-ui/react-accordion';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InteractInstruction } from '../InteractInstruction';

// Mock wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
    useWallet: () => ({
        connected: false,
        publicKey: null,
    }),
}));

// Mock usePdas hook
vi.mock('../../model/use-pdas', () => ({
    usePdas: () => ({}),
}));

describe('InteractInstruction', () => {
    // Helper to render InteractInstruction with accordion expanded
    const renderInteractInstruction = (instruction: InstructionData) => {
        return render(
            <Accordion type="multiple" value={[instruction.name]}>
                <InteractInstruction
                    idl={undefined}
                    instruction={instruction}
                    onExecuteInstruction={vi.fn()}
                    isExecuting={false}
                />
            </Accordion>
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
