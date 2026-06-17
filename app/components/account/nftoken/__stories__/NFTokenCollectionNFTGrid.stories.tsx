import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { NFTokenCollectionNFTGrid } from '../NFTokenCollectionNFTGrid';

// nftoken-hooks aliased in .storybook/main.ts; renders the captured 3-NFT mainnet slice.
const meta = {
    component: NFTokenCollectionNFTGrid,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/NFToken/CollectionNFTGrid',
} satisfies Meta<typeof NFTokenCollectionNFTGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { collection: '11111111111111111111111111111111' },
};
