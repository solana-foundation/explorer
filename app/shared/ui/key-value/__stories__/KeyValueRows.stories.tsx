import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { type KeyValueRow, KeyValueRows } from '../KeyValueRows';

const ROWS: KeyValueRow[] = [
    { label: 'Address', value: '11111111111111111111111111111111' },
    { label: 'Balance (SOL)', value: '4.2069' },
    { label: 'Executable', value: 'Yes' },
    { label: 'Allocated Data Size', value: '165 byte(s)' },
];

const meta: Meta<typeof KeyValueRows> = {
    args: {
        rows: ROWS,
    },
    component: KeyValueRows,
    decorators: [
        Story => (
            <div className="max-w-lg">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Shared/KeyValueRows',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Address')).toBeVisible();
        await expect(canvas.getByText('Allocated Data Size')).toBeVisible();
    },
};

export const HiddenRows: Story = {
    args: {
        rows: [
            { label: 'Address', value: '11111111111111111111111111111111' },
            { label: 'Hidden when absent', show: false, value: 'should not render' },
            { label: 'Executable', value: 'Yes' },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // A row with `show: false` is dropped, while rows without `show` stay visible.
        await expect(canvas.queryByText('Hidden when absent')).toBeNull();
        await expect(canvas.getByText('Address')).toBeVisible();
        await expect(canvas.getByText('Executable')).toBeVisible();
    },
};
