import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { AnchorAccountCard } from '../AnchorAccountCard';

const sampleAccount: Account = {
    data: { raw: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]) },
    executable: false,
    lamports: 1_000_000_000,
    owner: new PublicKey('11111111111111111111111111111111'),
    pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    space: 9,
};

const meta: Meta<typeof AnchorAccountCard> = {
    component: AnchorAccountCard,
    decorators: [withCluster, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AnchorAccountCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { account: sampleAccount };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
