import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import type { SysvarSlotHashesAccount } from '@/app/validators/accounts/sysvar';

import { SlotHashesCard } from '../SlotHashesCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof SlotHashesCard> = {
    component: SlotHashesCard,
    decorators: [withViewportFromGlobal, withCluster],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/SlotHashesCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const hash = (i: number) => `4xY${'k'.repeat(40)}${i}`;

const args = {
    sysvarAccount: {
        info: [
            { hash: hash(0), slot: 312_456_789 },
            { hash: hash(1), slot: 312_456_788 },
            { hash: hash(2), slot: 312_456_787 },
            { hash: hash(3), slot: 312_456_786 },
        ],
        type: 'slotHashes',
    } satisfies SysvarSlotHashesAccount,
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
