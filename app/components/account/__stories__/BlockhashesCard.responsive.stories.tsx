import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { gen } from '@__fixtures__/gen';

import { BlockhashesCard } from '../BlockhashesCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta<typeof BlockhashesCard> = {
    component: BlockhashesCard,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs'],
    title: 'Components/Account/BlockhashesCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    blockhashes: Array.from({ length: 4 }, (_, i) => ({
        blockhash: gen.blockhash(i),
        feeCalculator: { lamportsPerSignature: '5000' },
    })),
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
