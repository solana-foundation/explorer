import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import { SWRConfig, unstable_serialize } from 'swr';

import type { NftokenTypes } from '../nftoken-types';
import { NFTokenCollectionNFTGrid } from '../NFTokenCollectionNFTGrid';

const COLLECTION = '11111111111111111111111111111111';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

const emptyNfts: NftokenTypes.NftInfo[] = [];

const sampleNfts: NftokenTypes.NftInfo[] = [
    { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', image: '', name: 'Sample NFT 1' } as NftokenTypes.NftInfo,
    { address: 'SysvarRent111111111111111111111111111111111', image: '', name: 'Sample NFT 2' } as NftokenTypes.NftInfo,
];

const swrKey = ['getNftsInCollection', COLLECTION, RPC_URL];

const meta = {
    component: NFTokenCollectionNFTGrid,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/NFToken/CollectionNFTGrid',
} satisfies Meta<typeof NFTokenCollectionNFTGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: { collection: COLLECTION },
    decorators: [
        Story => (
            <SWRConfig value={{ fallback: { [unstable_serialize(swrKey)]: emptyNfts } }}>
                <Story />
            </SWRConfig>
        ),
    ],
};

export const WithNfts: Story = {
    args: { collection: COLLECTION },
    decorators: [
        Story => (
            <SWRConfig value={{ fallback: { [unstable_serialize(swrKey)]: sampleNfts } }}>
                <Story />
            </SWRConfig>
        ),
    ],
};
