import type { Meta, StoryObj } from '@storybook/react';
import { withClusterAndAccounts } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import type { NFTData } from '@/app/providers/accounts';

import { MetaplexNFTHeader } from '../MetaplexNFTHeader';

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const nftData = {
    editionInfo: { masterEdition: { supply: 1000n } as never },
    json: undefined,
    metadata: {
        collection: { __option: 'None' },
        creators: { __option: 'None' },
        isMutable: true,
        name: 'Bored Ape #1234',
        primarySaleHappened: false,
        symbol: 'BAYC',
    },
} as unknown as NFTData;

const meta: Meta<typeof MetaplexNFTHeader> = {
    component: MetaplexNFTHeader,
    decorators: [withClusterAndAccounts, withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTHeader/Responsive',
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
