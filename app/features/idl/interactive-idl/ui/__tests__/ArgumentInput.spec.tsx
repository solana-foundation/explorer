import type { ArgField } from '@entities/idl';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ArgumentInput } from '../ArgumentInput';

describe('ArgumentInput', () => {
    describe('SingleArgumentInput', () => {
        it('should render a single input for non-array types', () => {
            const arg = createArgField({ type: 'u64' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="123" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('123');
        });

        it('should display the argument name and type', () => {
            const arg = createArgField({ name: 'amount', type: 'u64' });

            render(<ArgumentInput arg={arg} value="" onChange={vi.fn()} />);

            expect(screen.getByText('amount')).toBeInTheDocument();
            expect(screen.getByText('u64')).toBeInTheDocument();
        });

        it('should display optional badge for optional arguments', () => {
            const arg = createArgField({ type: 'option(u64)' });

            render(<ArgumentInput arg={arg} value="" onChange={vi.fn()} />);

            expect(screen.getByText('Optional')).toBeInTheDocument();
        });

        it('should not display optional badge for required arguments', () => {
            const arg = createArgField({ type: 'u64' });

            render(<ArgumentInput arg={arg} value="" onChange={vi.fn()} />);

            expect(screen.queryByText('Optional')).not.toBeInTheDocument();
        });

        it('should display error message when error is provided', () => {
            const arg = createArgField();
            const error = { message: 'Invalid input' };

            render(<ArgumentInput arg={arg} value="" error={error} onChange={vi.fn()} />);

            expect(screen.getByText('Invalid input')).toBeInTheDocument();
        });

        it('should display documentation when provided', () => {
            const arg = createArgField({ docs: ['This is a test argument', 'with multiple lines'] });

            render(<ArgumentInput arg={arg} value="" onChange={vi.fn()} />);

            expect(screen.getByText('This is a test argument with multiple lines')).toBeInTheDocument();
        });

        it('should forward ref to input element', () => {
            const arg = createArgField();
            const ref = { current: null } as React.RefObject<HTMLInputElement>;

            render(<ArgumentInput ref={ref} arg={arg} value="" onChange={vi.fn()} />);

            expect(ref.current).toBeInstanceOf(HTMLInputElement);
        });

        it('should call onChange when input value changes', async () => {
            const user = userEvent.setup();
            const arg = createArgField();
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.type(input, '123');

            expect(handleChange).toHaveBeenCalled();
        });
    });

    describe('ArrayArgumentInput', () => {
        it('should render array inputs for array types', () => {
            const arg = createArgField({ type: 'array(u8, 3)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="1, 2, 3" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(input => input.value)).toEqual(['1', '2', '3']);
        });

        it('should render array inputs for vector types', () => {
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="a, b" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(input => input.value)).toEqual(['a', 'b']);
        });

        it('should render single empty input when value is empty', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="" />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(input => input.value)).toEqual(['']);
        });

        it('should render single empty input when value is whitespace only', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="   " />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(input => input.value)).toEqual(['']);
        });

        it('should display Add button', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="" />);

            expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
        });

        it('should add new item when Add button is clicked', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="item1" onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            await user.click(addButton);

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('item1, ');
        });

        it('should not add item when last item is empty', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            expect(addButton).toBeDisabled();

            await user.click(addButton);
            expect(handleChange).not.toHaveBeenCalled();
        });

        it('should disable Add button when last item is empty', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="item1, " />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            expect(addButton).toBeDisabled();
        });

        it('should add new item when Enter is pressed in the last input', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="item1" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            const lastInput = inputs[inputs.length - 1];
            await user.type(lastInput, '{Enter}');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('item1, ');
        });

        it('should not add item when Enter is pressed in non-last input', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="item1, item2" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            const firstInput = inputs[0];
            await user.type(firstInput, '{Enter}');

            const addCalls = handleChange.mock.calls.filter(
                call => call[0].target.value.includes(', ') && call[0].target.value.split(', ').length > 2
            );
            expect(addCalls.length).toBe(0);
        });

        it('should not add item when Enter is pressed in empty last input', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.type(input, '{Enter}');

            const addCalls = handleChange.mock.calls.filter(call => call[0].target.value.includes(', '));
            expect(addCalls.length).toBe(0);
        });

        it('should focus next input when Enter is pressed on last input', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="item1" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            const lastInput = inputs[inputs.length - 1];
            await user.click(lastInput);
            await user.keyboard('{Enter}');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('item1, ');

            // Simulate parent updating value
            rerender(<ArgumentInput arg={arg} value="item1, " onChange={handleChange} />);

            expect(screen.getAllByRole('textbox')).toHaveLength(2);
            const newInputs = screen.getAllByRole('textbox');
            expect(newInputs[1]).toHaveFocus();
        });

        it('should focus previous input when item is removed', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="a, b, c" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            await user.click(inputs[1]);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[1]);

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('a, c');

            // Simulate parent updating value
            rerender(<ArgumentInput arg={arg} value="a, c" onChange={handleChange} />);

            expect(screen.getAllByRole('textbox')).toHaveLength(2);
            const newInputs = screen.getAllByRole('textbox');
            expect(newInputs[1]).toHaveFocus();
        });

        it('should focus previous input when last item is removed', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="a, b" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            await user.click(inputs[1]);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[1]);

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('a');

            rerender(<ArgumentInput arg={arg} value="a" onChange={handleChange} />);

            expect(screen.getAllByRole('textbox')).toHaveLength(1);

            const newInputs = screen.getAllByRole('textbox');
            expect(newInputs[0]).toHaveFocus();
        });

        it('should display remove button for items when there are multiple items', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="a, b" />);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            expect(removeButtons).toHaveLength(2);
        });

        it('should not display remove button when there is only one item', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="single" />);

            expect(screen.queryByRole('button', { name: 'Remove item' })).not.toBeInTheDocument();
        });

        it('should remove item when remove button is clicked', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="a, b, c" onChange={handleChange} />);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[1]);

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('a, c');
        });

        it('should remove first item when its remove button is clicked', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="first, second" onChange={handleChange} />);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[0]);

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('second');
        });

        it('should not remove item when it is the last remaining item', () => {
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="only" onChange={handleChange} />);

            expect(screen.queryByRole('button', { name: 'Remove item' })).not.toBeInTheDocument();
        });

        it('should filter out commas from input values', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.type(input, 'hello, world');

            expect(handleChange).toHaveBeenCalled();
            // Verify no calls contain commas (comma filtering behavior)
            const callsWithComma = handleChange.mock.calls.filter(call => call[0].target.value.includes(','));
            expect(callsWithComma.length).toBe(0);

            const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
            const finalValue = lastCall[0].target.value;
            expect(finalValue).not.toContain(',');
            expect(finalValue.length).toBeGreaterThan(0);
        });

        it('should update value when input changes', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.type(input, 'new');

            expect(handleChange).toHaveBeenCalled();
            // Exact values depend on controlled input behavior, but calls should be received
            expect(handleChange.mock.calls.length).toBeGreaterThan(0);
        });

        it('should maintain stable keys when items are removed', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="a, b, c" onChange={handleChange} />);

            const inputsBefore = screen.getAllByRole('textbox');
            const firstInputBefore = inputsBefore[0];
            const thirdInputBefore = inputsBefore[2];

            await user.click(thirdInputBefore);
            await user.type(thirdInputBefore, 'x');

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[1]);

            rerender(<ArgumentInput arg={arg} value="a, cx" onChange={handleChange} />);

            const inputsAfter = screen.getAllByRole('textbox');
            // Verify stable keys: inputs maintain their DOM node identity after removal
            expect(inputsAfter[0]).toBe(firstInputBefore);
            expect(inputsAfter[1]).toBe(thirdInputBefore);
        });

        it('should forward ref to first input element', () => {
            const arg = createArgField({ type: 'vec(u8)' });
            const ref = { current: null } as React.RefObject<HTMLInputElement>;

            render(<ArgumentInput ref={ref} arg={arg} value="a, b" />);

            const inputs = screen.getAllByRole('textbox');
            expect(ref.current).toBe(inputs[0]);
        });

        it('should handle empty string value', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="" />);

            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(1);
            expect(inputs[0]).toHaveValue('');
        });

        it('should handle undefined value', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value={undefined} />);

            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(1);
            expect(inputs[0]).toHaveValue('');
        });

        it('should handle values with extra spaces', () => {
            const arg = createArgField({ type: 'vec(u8)' });

            render(<ArgumentInput arg={arg} value="  a  ,  b  ,  c  " />);

            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(3);
            expect(inputs[0]).toHaveValue('a');
            expect(inputs[1]).toHaveValue('b');
            expect(inputs[2]).toHaveValue('c');
        });

        it('should call onBlur when input loses focus', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleBlur = vi.fn();

            render(<ArgumentInput arg={arg} value="test" onBlur={handleBlur} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.tab(); // Move focus away

            expect(handleBlur).toHaveBeenCalled();
        });

        it('should set aria-invalid when error is present', () => {
            const arg = createArgField({ type: 'vec(u8)' });
            const error = { message: 'Error message' };

            render(<ArgumentInput arg={arg} value="" error={error} />);

            const inputs = screen.getAllByRole('textbox');
            inputs.forEach(input => {
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('should handle adding multiple items sequentially', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="first" onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            await user.click(addButton);

            const firstCall = handleChange.mock.calls[0][0];
            expect(firstCall.target.value).toBe('first, ');

            handleChange.mockClear();
            rerender(<ArgumentInput arg={arg} value="first, " onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(2);
            await user.click(inputs[1]);
            await user.type(inputs[1], 'second');

            expect(handleChange).toHaveBeenCalled();
            handleChange.mockClear();
            rerender(<ArgumentInput arg={arg} value="first, second" onChange={handleChange} />);

            await user.click(addButton);

            const addCall = handleChange.mock.calls[0][0];
            expect(addCall.target.value).toBe('first, second, ');
        });

        it('should handle removing first item and then adding new item', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="a, b" onChange={handleChange} />);

            const removeButtons = screen.getAllByRole('button', { name: 'Remove item' });
            await user.click(removeButtons[0]);

            const removeCall = handleChange.mock.calls[0][0];
            expect(removeCall.target.value).toBe('b');

            rerender(<ArgumentInput arg={arg} value="b" onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            await user.click(addButton);

            const addCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
            expect(addCall.target.value).toBe('b, ');
        });

        it('should split comma-separated values on paste', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.paste('Ben, Sam');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('Ben, Sam');

            rerender(<ArgumentInput arg={arg} value="Ben, Sam" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(i => i.value)).toEqual(['Ben', 'Sam']);
        });

        it('should filter out empty values when pasting', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.paste('Ben, , Sam, , Alex');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('Ben, Sam, Alex');

            rerender(<ArgumentInput arg={arg} value="Ben, Sam, Alex" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(i => i.value)).toEqual(['Ben', 'Sam', 'Alex']);
        });

        it('should handle pasting single value without comma', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.paste('SingleValue');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('SingleValue');

            rerender(<ArgumentInput arg={arg} value="SingleValue" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(i => i.value)).toEqual(['SingleValue']);
        });

        it('should handle pasting into existing input and replace with first value', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="existing" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.keyboard('{Control>}a{/Control}');
            await user.paste('First, Second, Third');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('First, Second, Third');

            rerender(<ArgumentInput arg={arg} value="First, Second, Third" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(i => i.value)).toEqual(['First', 'Second', 'Third']);
        });

        it('should handle pasting with extra spaces', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="" onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.paste('  Ben  ,  Sam  ,  Alex  ');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('Ben, Sam, Alex');

            rerender(<ArgumentInput arg={arg} value="Ben, Sam, Alex" onChange={handleChange} />);

            const inputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(inputs.map(i => i.value)).toEqual(['Ben', 'Sam', 'Alex']);
        });

        it('should handle pasting into middle input', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const { rerender } = render(<ArgumentInput arg={arg} value="first, second" onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            await user.click(inputs[1]);
            await user.keyboard('{Control>}a{/Control}');
            await user.paste('new1, new2, new3');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            expect(event.target.value).toBe('first, new1, new2, new3');

            rerender(<ArgumentInput arg={arg} value="first, new1, new2, new3" onChange={handleChange} />);

            const updatedInputs: HTMLInputElement[] = screen.getAllByRole('textbox');
            expect(updatedInputs.map(i => i.value)).toEqual(['first', 'new1', 'new2', 'new3']);
        });

        it('should not add item when max length is reached', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const maxItems = Array.from({ length: 100 }, (_, i) => `item${i}`).join(', ');
            render(<ArgumentInput arg={arg} value={maxItems} onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            expect(addButton).toBeDisabled();

            await user.click(addButton);
            expect(handleChange).not.toHaveBeenCalled();
        });

        it('should limit paste to max length', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const existingItems = Array.from({ length: 99 }, (_, i) => `item${i}`).join(', ');
            render(<ArgumentInput arg={arg} value={existingItems} onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            const lastInput = inputs[inputs.length - 1];
            await user.click(lastInput);
            await user.paste('new1, new2, new3, new4, new5');

            expect(handleChange).toHaveBeenCalled();
            const event = handleChange.mock.calls[0][0];
            const pastedValues = event.target.value.split(', ');
            // Should only add 1 item (to reach max of 100)
            expect(pastedValues.length).toBe(100);
        });

        it('should not allow Enter to add item when at max length', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ type: 'vec(u8)' });
            const handleChange = vi.fn();

            const maxItems = Array.from({ length: 100 }, (_, i) => `item${i}`).join(', ');
            render(<ArgumentInput arg={arg} value={maxItems} onChange={handleChange} />);

            const inputs = screen.getAllByRole('textbox');
            const lastInput = inputs[inputs.length - 1];

            await user.click(lastInput);
            await user.keyboard('{Enter}');

            expect(handleChange).not.toHaveBeenCalled();
        });

        it('should respect max length from array type', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ rawType: { array: ['string', 3] }, type: 'array(string, 3)' });
            const handleChange = vi.fn();

            const maxItems = 'item1, item2, item3';
            render(<ArgumentInput arg={arg} value={maxItems} onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            expect(addButton).toBeDisabled();

            await user.click(addButton);
            expect(handleChange).not.toHaveBeenCalled();
        });

        it('should allow adding items up to array type max length', async () => {
            const user = userEvent.setup();
            const arg = createArgField({ rawType: { array: ['u8', 5] }, type: 'array(u8, 5)' });
            const handleChange = vi.fn();

            render(<ArgumentInput arg={arg} value="item1, item2" onChange={handleChange} />);

            const addButton = screen.getByRole('button', { name: 'Add' });
            expect(addButton).not.toBeDisabled();

            await user.click(addButton);
            expect(handleChange).toHaveBeenCalled();
        });
    });
});

function createArgField(overrides?: Partial<ArgField>): ArgField {
    return {
        docs: [],
        name: 'testArg',
        type: 'u64',
        ...overrides,
    };
}
