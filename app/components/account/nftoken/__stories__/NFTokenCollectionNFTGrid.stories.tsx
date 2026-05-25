import { useCluster } from '@providers/cluster';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { ReactNode } from 'react';
import { SWRConfig, unstable_serialize } from 'swr';

import type { NftokenTypes } from '../nftoken-types';
import { NFTokenCollectionNFTGrid } from '../NFTokenCollectionNFTGrid';

const COLLECTION = '11111111111111111111111111111111';

const emptyNfts: NftokenTypes.NftInfo[] = [];

const sampleNfts: NftokenTypes.NftInfo[] = [
    { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', image: '', name: 'Sample NFT 1' } as NftokenTypes.NftInfo,
    { address: 'SysvarRent111111111111111111111111111111111', image: '', name: 'Sample NFT 2' } as NftokenTypes.NftInfo,
    { address: 'So11111111111111111111111111111111111111112', image: '', name: 'Sample NFT 3' } as NftokenTypes.NftInfo,
];

// The SWR cache key for useCollectionNfts includes the runtime cluster URL, which depends
// on env (.env.local Helius URL vs. the public mainnet URL). Read it here at render time
// so the fallback entry actually matches the lookup key — otherwise SWR's suspense fetch
// fires and the story hangs on the network request forever.
function SeedNftCache({ children, data, collection }: { children: ReactNode; data: NftokenTypes.NftInfo[]; collection: string }) {
    const { url } = useCluster();
    const key = unstable_serialize(['getNftsInCollection', collection, url]);
    return <SWRConfig value={{ fallback: { [key]: data } }}>{children}</SWRConfig>;
}

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
            <SeedNftCache data={emptyNfts} collection={COLLECTION}>
                <Story />
            </SeedNftCache>
        ),
    ],
};

export const WithNfts: Story = {
    args: { collection: COLLECTION },
    decorators: [
        Story => (
            <SeedNftCache data={sampleNfts} collection={COLLECTION}>
                <Story />
            </SeedNftCache>
        ),
    ],
};
