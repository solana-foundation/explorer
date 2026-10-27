import { makeNftData } from '@entities/nft/__fixtures__/make-nft-data';
import { withClusterAndAccounts } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { MetaplexNFTHeader } from '../MetaplexNFTHeader';

const BORED_APE = { json: undefined, name: 'Bored Ape #1234', symbol: 'BAYC' };

const meta: Meta<typeof MetaplexNFTHeader> = {
    component: MetaplexNFTHeader,
    decorators: [withClusterAndAccounts],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTHeader',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        nftData: makeNftData(BORED_APE),
    },
};

export const MasterEdition: Story = {
    args: {
        nftData: makeNftData({ ...BORED_APE, editionInfo: { masterEdition: { supply: 1000n } as never } }),
    },
};

export const NumberedEdition: Story = {
    args: {
        nftData: makeNftData({
            ...BORED_APE,
            editionInfo: {
                edition: { edition: 42n } as never,
                masterEdition: { supply: 1000n } as never,
            },
        }),
    },
};

export const NoName: Story = {
    args: {
        nftData: makeNftData({ ...BORED_APE, name: '' }),
    },
};

export const NoSymbol: Story = {
    args: {
        nftData: makeNftData({ ...BORED_APE, symbol: '' }),
    },
};

export const Immutable: Story = {
    args: {
        nftData: makeNftData({ ...BORED_APE, isMutable: false }),
    },
};
