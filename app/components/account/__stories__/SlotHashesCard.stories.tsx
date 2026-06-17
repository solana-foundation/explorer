import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import type { SysvarSlotHashesAccount } from '@/app/validators/accounts/sysvar';

import { SlotHashesCard } from '../SlotHashesCard';

const meta: Meta<typeof SlotHashesCard> = {
    component: SlotHashesCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/SlotHashesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const hash = (i: number) => `4xY${'k'.repeat(40)}${i}`;

export const WithEntries: Story = {
    args: {
        sysvarAccount: {
            info: [
                { hash: hash(0), slot: 312_456_789 },
                { hash: hash(1), slot: 312_456_788 },
                { hash: hash(2), slot: 312_456_787 },
                { hash: hash(3), slot: 312_456_786 },
            ],
            type: 'slotHashes',
        } satisfies SysvarSlotHashesAccount,
    },
};

export const Empty: Story = {
    args: {
        sysvarAccount: { info: [], type: 'slotHashes' } satisfies SysvarSlotHashesAccount,
    },
};
