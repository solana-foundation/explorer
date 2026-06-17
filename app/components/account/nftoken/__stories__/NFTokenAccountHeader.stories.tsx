import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NFTokenCollectionHeader, NFTokenNFTHeader } from '../NFTokenAccountHeader';

// useNftokenMetadata is mocked in .storybook/__mocks__/nftoken-hooks.tsx to return `data: null`,
// so the rendered title reads "Loading..." — sufficient for layout coverage / row/col refactor backstop.
const meta: Meta = {
    tags: ['autodocs', 'test'],
    title: 'Components/Account/NFToken/NFTokenAccountHeader',
};

export default meta;

type NftStory = StoryObj<typeof NFTokenNFTHeader>;
type CollectionStory = StoryObj<typeof NFTokenCollectionHeader>;

const baseNft = {
    address: 'NFT1Tokenaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    authority: 'Authoraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    collection: null,
    delegate: null,
    holder: 'Holderaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    metadata_url: 'https://example.com/nft.json',
};

const baseCollection = {
    address: 'Collectionaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    authority: 'Authoraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    metadata_url: 'https://example.com/collection.json',
};

export const NftMutable: NftStory = {
    args: { nft: { ...baseNft, authority_can_update: true } },
    render: args => <NFTokenNFTHeader {...args} />,
};

export const NftImmutable: NftStory = {
    args: { nft: { ...baseNft, authority_can_update: false } },
    render: args => <NFTokenNFTHeader {...args} />,
};

export const CollectionMutable: CollectionStory = {
    args: { collection: { ...baseCollection, authority_can_update: true } },
    render: args => <NFTokenCollectionHeader {...args} />,
};

export const CollectionImmutable: CollectionStory = {
    args: { collection: { ...baseCollection, authority_can_update: false } },
    render: args => <NFTokenCollectionHeader {...args} />,
};
