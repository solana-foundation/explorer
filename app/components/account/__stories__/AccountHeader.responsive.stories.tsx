import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenMintHeaderCard } from '../AccountHeader';

const meta: Meta<typeof TokenMintHeaderCard> = {
    component: TokenMintHeaderCard,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AccountHeader/TokenMintHeaderCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    token: { logoURI: undefined, name: 'USD Coin', symbol: 'USDC' },
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
