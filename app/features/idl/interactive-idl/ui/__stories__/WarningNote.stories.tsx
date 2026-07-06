import type { Meta, StoryObj } from '@storybook-config/types';

import { WarningNote } from '../WarningNote';

const meta: Meta<typeof WarningNote> = {
    component: WarningNote,
    globals: { viewport: { value: 'responsive' } },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Interactive IDL/WarningNote',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        label: 'You are connected to Mainnet, which uses real funds',
    },
};

export const LongText: Story = {
    args: {
        label: 'You are connected to Mainnet, which uses real funds. Double-check every account and argument before executing this instruction, as the action cannot be undone.',
    },
};

export const CustomClassName: Story = {
    args: {
        className: 'mt-0 justify-center rounded-lg bg-destructive/10 p-2',
        label: 'You are connected to Mainnet, which uses real funds',
    },
};
