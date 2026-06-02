import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { NFTokenCollectionNFTGrid } from '../NFTokenCollectionNFTGrid';

// nftoken-hooks aliased in .storybook/main.ts; renders the captured 3-NFT mainnet slice.
const meta = {
    component: NFTokenCollectionNFTGrid,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/NFToken/CollectionNFTGrid',
} satisfies Meta<typeof NFTokenCollectionNFTGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { collection: '11111111111111111111111111111111' },
};
