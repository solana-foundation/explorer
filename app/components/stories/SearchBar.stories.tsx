import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { ClusterProvider } from '@/app/providers/cluster';

import { SearchBar } from '../SearchBar';

const meta: Meta<typeof SearchBar> = {
    component: SearchBar,
    decorators: [
        Story => (
            <ClusterProvider>
                <Story />
            </ClusterProvider>
        ),
    ],
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
        },
    },
    title: 'Components/SearchBar',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox');
        expect(input).toBeInTheDocument();

        const placeholder = canvas.getByText(/Search for blocks, accounts, transactions/i);
        expect(placeholder).toBeInTheDocument();
    },
};
export const MobileContextMenuFix: Story = {
    name: 'Mobile Context Menu Fix (Copy/Paste)',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox');

        // Verify input is visible and interactable
        expect(input).toBeVisible();
        expect(input).toBeEnabled();

        // Verify input has sufficient width for touch targets
        // By default react-select input is only 2px wide, making it impossible to tap on mobile
        // Minimum touch target is 44px (Apple HIG) / 48px (Material Design)
        // See: https://github.com/JedWatson/react-select/issues/4106
        const inputRect = input.getBoundingClientRect();
        expect(inputRect.width).toBeGreaterThan(44);

        // Verify we can click and type in the input
        // This fails if pointer-events is 'none' on the control
        // See: https://github.com/JedWatson/react-select/issues/3857
        await userEvent.click(input);
        expect(input).toHaveFocus();

        await userEvent.type(input, 'test');
        expect(input).toHaveValue('test');
    },
};
