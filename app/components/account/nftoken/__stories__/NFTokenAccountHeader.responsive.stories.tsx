import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { NFTokenNFTHeader } from '../NFTokenAccountHeader';

const nft = {
    address: 'NFT1Tokenaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    authority: 'Authoraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    authority_can_update: true,
    collection: null,
    delegate: null,
    holder: 'Holderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    metadata_url: 'https://example.com/nft.json',
};

const meta: Meta<typeof NFTokenNFTHeader> = {
    component: NFTokenNFTHeader,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/NFToken/NFTokenAccountHeader@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { nft };

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
