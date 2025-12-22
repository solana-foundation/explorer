import type { ArgField } from '@entities/idl';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { ArgumentInput } from '../ArgumentInput';

const meta = {
    component: ArgumentInput,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    title: 'Features/IDL/Interactive IDL/UI/ArgumentInput',
} satisfies Meta<typeof ArgumentInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle controlled state
function ControlledArgumentInput({ arg, initialValue = '' }: { arg: ArgField; initialValue?: string }) {
    const [value, setValue] = useState(initialValue);
    return <ArgumentInput arg={arg} value={value} onChange={e => setValue(e.target.value)} />;
}

/**
 * Simple u64 argument input
 */
export const SimpleType: Story = {
    args: {
        arg: {
            docs: [],
            name: 'amount',
            type: 'u64',
        },
        value: '1000',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have single input with value
        const input = canvas.getByRole('textbox');
        expect(input).toHaveValue('1000');

        // Should display label and type badge
        expect(canvas.getByText('amount')).toBeInTheDocument();
        expect(canvas.getByText('u64')).toBeInTheDocument();

        // Should NOT show Optional badge (required field)
        expect(canvas.queryByText('Optional')).not.toBeInTheDocument();

        // Should NOT have Add button (not an array)
        expect(canvas.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    },
};

/**
 * Optional argument with option wrapper
 */
export const OptionalType: Story = {
    args: {
        arg: {
            docs: ['An optional amount value'],
            name: 'optionalAmount',
            type: 'option(u64)',
        },
        value: '',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have single input
        const input = canvas.getByRole('textbox');
        expect(input).toHaveValue('');

        // Should display label and type badge
        expect(canvas.getByText('optionalAmount')).toBeInTheDocument();
        expect(canvas.getByText('option(u64)')).toBeInTheDocument();

        // Should show Optional badge
        expect(canvas.getByText('Optional')).toBeInTheDocument();

        // Should display docs
        expect(canvas.getByText('An optional amount value')).toBeInTheDocument();
    },
};

/**
 * Vector type - unlimited array inputs
 */
export const VectorType: Story = {
    args: {
        arg: {
            docs: ['A list of public keys'],
            name: 'recipients',
            rawType: { vec: 'pubkey' },
            type: 'vec(pubkey)',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have 2 inputs for the 2 initial values
        const inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveValue('key1');
        expect(inputs[1]).toHaveValue('key2');

        // Should have Add button (vector type)
        const addButton = canvas.getByRole('button', { name: 'Add' });
        expect(addButton).not.toBeDisabled();

        // Should have remove buttons for each item
        const removeButtons = canvas.getAllByRole('button', { name: 'Remove item' });
        expect(removeButtons).toHaveLength(2);
    },
    render: args => <ControlledArgumentInput arg={args.arg} initialValue="key1, key2" />,
};

/**
 * Fixed array with limit of 12 items - try adding items until max
 */
export const ArrayWithLimit: Story = {
    args: {
        arg: {
            docs: ['Fixed array of 12 values - Add button disables at max'],
            name: 'data',
            rawType: { array: ['u8', 12] },
            type: 'array(u8, 12)',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const addButton = canvas.getByRole('button', { name: 'Add' });

        // Start with 3 items
        let inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(3);
        expect(addButton).not.toBeDisabled();

        // Add items until we reach the max (12)
        // Add button is disabled when last input is empty, so we type first then add
        for (let i = 4; i <= 12; i++) {
            // Click Add to create new empty input
            await userEvent.click(addButton);
            inputs = canvas.getAllByRole('textbox');
            expect(inputs).toHaveLength(i);

            // Add button should be disabled while last input is empty
            expect(addButton).toBeDisabled();

            // Type a value in the new input to enable Add button again
            const lastInput = inputs[inputs.length - 1];
            await userEvent.type(lastInput, String(i));

            // After typing, Add button should be enabled (unless at max)
            if (i < 12) {
                expect(addButton).not.toBeDisabled();
            }
        }

        // Now we should have 12 inputs and Add button should be disabled (at max)
        inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(12);
        expect(addButton).toBeDisabled();

        // Try clicking Add - should not add more items
        await userEvent.click(addButton);
        inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(12);
    },
    render: args => <ControlledArgumentInput arg={args.arg} initialValue="1, 2, 3" />,
};

/**
 * Optional array - option(array(u8, 4))
 */
export const OptionArray: Story = {
    args: {
        arg: {
            docs: ['Optional fixed array of 4 bytes'],
            name: 'optionalData',
            rawType: { option: { array: ['u8', 4] } },
            type: 'option(array(u8, 4))',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have 3 inputs for initial values
        const inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(3);
        expect(inputs[0]).toHaveValue('10');
        expect(inputs[1]).toHaveValue('20');
        expect(inputs[2]).toHaveValue('30');

        // Should display label and type badge
        expect(canvas.getByText('optionalData')).toBeInTheDocument();
        expect(canvas.getByText('option(array(u8, 4))')).toBeInTheDocument();

        // Should show Optional badge (option wrapper)
        expect(canvas.getByText('Optional')).toBeInTheDocument();

        // Should have Add button (max 4, currently 3)
        const addButton = canvas.getByRole('button', { name: 'Add' });
        expect(addButton).not.toBeDisabled();

        // Should have remove buttons for each item
        const removeButtons = canvas.getAllByRole('button', { name: 'Remove item' });
        expect(removeButtons).toHaveLength(3);
    },
    render: args => <ControlledArgumentInput arg={args.arg} initialValue="10, 20, 30" />,
};

/**
 * C-style optional array - coption(array(bool, 3))
 */
export const COptionArray: Story = {
    args: {
        arg: {
            docs: ['C-style optional fixed array of 3 booleans'],
            name: 'flags',
            rawType: { coption: { array: ['bool', 3] } },
            type: 'coption(array(bool, 3))',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have 2 inputs for initial values
        const inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveValue('true');
        expect(inputs[1]).toHaveValue('false');

        // Should display label and type badge
        expect(canvas.getByText('flags')).toBeInTheDocument();
        expect(canvas.getByText('coption(array(bool, 3))')).toBeInTheDocument();

        // Should show Optional badge (coption wrapper)
        expect(canvas.getByText('Optional')).toBeInTheDocument();

        // Should have Add button (max 3, currently 2)
        const addButton = canvas.getByRole('button', { name: 'Add' });
        expect(addButton).not.toBeDisabled();

        // Should have remove buttons for each item
        const removeButtons = canvas.getAllByRole('button', { name: 'Remove item' });
        expect(removeButtons).toHaveLength(2);
    },
    render: args => <ControlledArgumentInput arg={args.arg} initialValue="true, false" />,
};

/**
 * Array with error state
 */
export const ArrayWithError: Story = {
    args: {
        arg: {
            docs: [],
            name: 'invalidData',
            rawType: { array: ['u8', 5] },
            type: 'array(u8, 5)',
        },
        error: { message: 'Invalid array values' },
        value: '1, invalid, 3',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have 3 inputs for initial values
        const inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(3);
        expect(inputs[0]).toHaveValue('1');
        expect(inputs[1]).toHaveValue('invalid');
        expect(inputs[2]).toHaveValue('3');

        // Should display label and type badge
        expect(canvas.getByText('invalidData')).toBeInTheDocument();
        expect(canvas.getByText('array(u8, 5)')).toBeInTheDocument();

        // Should NOT show Optional badge (required field)
        expect(canvas.queryByText('Optional')).not.toBeInTheDocument();

        // Should display error message
        expect(canvas.getByText('Invalid array values')).toBeInTheDocument();

        // Should have Add button (max 5, currently 3)
        const addButton = canvas.getByRole('button', { name: 'Add' });
        expect(addButton).not.toBeDisabled();
    },
};

/**
 * Large array limit (32 bytes - common for hashes/signatures)
 */
export const LargeArrayLimit: Story = {
    args: {
        arg: {
            docs: ['32-byte hash value'],
            name: 'hash',
            rawType: { array: ['u8', 32] },
            type: 'array(u8, 32)',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should have 5 inputs for initial values
        const inputs = canvas.getAllByRole('textbox');
        expect(inputs).toHaveLength(5);
        expect(inputs[0]).toHaveValue('1');
        expect(inputs[1]).toHaveValue('2');
        expect(inputs[2]).toHaveValue('3');
        expect(inputs[3]).toHaveValue('4');
        expect(inputs[4]).toHaveValue('5');

        // Should display label and type badge
        expect(canvas.getByText('hash')).toBeInTheDocument();
        expect(canvas.getByText('array(u8, 32)')).toBeInTheDocument();

        // Should NOT show Optional badge (required field)
        expect(canvas.queryByText('Optional')).not.toBeInTheDocument();

        // Should display docs
        expect(canvas.getByText('32-byte hash value')).toBeInTheDocument();

        // Should have Add button (max 32, currently 5)
        const addButton = canvas.getByRole('button', { name: 'Add' });
        expect(addButton).not.toBeDisabled();

        // Should have remove buttons for each item
        const removeButtons = canvas.getAllByRole('button', { name: 'Remove item' });
        expect(removeButtons).toHaveLength(5);
    },
    render: args => <ControlledArgumentInput arg={args.arg} initialValue="1, 2, 3, 4, 5" />,
};
