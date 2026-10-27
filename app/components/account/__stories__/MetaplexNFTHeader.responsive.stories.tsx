import { makeNftData } from '@entities/nft/__fixtures__/make-nft-data';
import { withClusterAndAccounts } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { MetaplexNFTHeader } from '../MetaplexNFTHeader';

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const nftData = makeNftData({
    editionInfo: { masterEdition: { supply: 1000n } as never },
    json: undefined,
    name: 'Bored Ape #1234',
    symbol: 'BAYC',
});

const meta: Meta<typeof MetaplexNFTHeader> = {
    component: MetaplexNFTHeader,
    decorators: [withClusterAndAccounts, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTHeader@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS, nftData };

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
