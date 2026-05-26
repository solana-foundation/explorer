import type { Meta, StoryObj } from '@storybook/react';

import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { SlotHashesCard } from '../SlotHashesCard';

const meta: Meta<typeof SlotHashesCard> = {
    component: SlotHashesCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/SlotHashesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const hash = (i: number) => `4xY${'k'.repeat(40)}${i}`;

export const WithEntries: Story = {
    args: {
        sysvarAccount: {
            info: [
                { slot: 312_456_789n, hash: hash(0) },
                { slot: 312_456_788n, hash: hash(1) },
                { slot: 312_456_787n, hash: hash(2) },
                { slot: 312_456_786n, hash: hash(3) },
            ],
            // Other SysvarAccount fields aren't read by SlotHashesCard; cast keeps TS happy.
        } as any,
    },
};

export const Empty: Story = {
    args: {
        sysvarAccount: { info: [] } as any,
    },
};
