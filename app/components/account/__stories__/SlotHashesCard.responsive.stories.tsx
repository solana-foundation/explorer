import { gen } from '@__fixtures__/gen';
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
    title: 'Components/Account/SlotHashesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseSlot = gen.slot(0);
const args = {
    sysvarAccount: {
        info: Array.from({ length: 4 }, (_, i) => ({
            hash: gen.blockhash(i),
            slot: Number(baseSlot) - i,
        })),
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
