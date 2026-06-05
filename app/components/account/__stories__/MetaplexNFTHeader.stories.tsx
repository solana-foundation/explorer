import type { Meta, StoryObj } from '@storybook/react';
import { withClusterAndAccounts } from '@storybook-config/decorators';

import type { NFTData } from '@/app/providers/accounts';

import { MetaplexNFTHeader } from '../MetaplexNFTHeader';

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// MetaplexNFTHeader reads flat fields on `metadata`; the local `NFTData` type is acknowledged
// as incomplete (see app/features/metadata/mocks.ts), so each fixture casts via `as unknown as NFTData`.
function buildNftData(
    overrides: Partial<{
        name: string;
        symbol: string;
        isMutable: boolean;
        primarySaleHappened: boolean;
        collection: { key: string; verified: boolean } | null;
        edition: { masterEdition?: { supply: bigint }; edition?: { edition: bigint } };
        image: string;
    }> = {},
): NFTData {
    const {
        name = 'Bored Ape #1234',
        symbol = 'BAYC',
        isMutable = true,
        primarySaleHappened = false,
        collection = null,
        edition = {},
        image = '',
    } = overrides;

    return {
        editionInfo: edition,
        json: image ? { image } : undefined,
        metadata: {
            collection: collection ? { __option: 'Some', value: collection } : { __option: 'None' },
            creators: { __option: 'None' },
            isMutable,
            name,
            primarySaleHappened,
            symbol,
        },
    } as unknown as NFTData;
}

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
        address: ADDRESS,
        nftData: buildNftData(),
    },
};

export const MasterEdition: Story = {
    args: {
        address: ADDRESS,
        nftData: buildNftData({
            edition: { masterEdition: { supply: 1000n } as never },
        }),
    },
};

export const NumberedEdition: Story = {
    args: {
        address: ADDRESS,
        nftData: buildNftData({
            edition: {
                edition: { edition: 42n } as never,
                masterEdition: { supply: 1000n } as never,
            },
        }),
    },
};

export const NoName: Story = {
    args: {
        address: ADDRESS,
        nftData: buildNftData({ name: '' }),
    },
};

export const NoSymbol: Story = {
    args: {
        address: ADDRESS,
        nftData: buildNftData({ symbol: '' }),
    },
};

export const Immutable: Story = {
    args: {
        address: ADDRESS,
        nftData: buildNftData({ isMutable: false }),
    },
};
