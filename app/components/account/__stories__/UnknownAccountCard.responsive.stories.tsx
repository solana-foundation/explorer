import { gen } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { UnknownAccountCard } from '../UnknownAccountCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: UnknownAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/UnknownAccountCard@Media',
} satisfies Meta<typeof UnknownAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    account: {
        data: {},
        executable: false,
        lamports: 1_000_000_000,
        owner: PublicKey.default,
        pubkey: gen.publicKey(1),
        space: 165,
    },
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
