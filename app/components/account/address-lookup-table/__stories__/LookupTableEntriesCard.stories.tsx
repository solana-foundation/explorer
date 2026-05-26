import type { Meta, StoryObj } from '@storybook/react';

import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { LookupTableEntriesCard } from '../LookupTableEntriesCard';

const meta: Meta<typeof LookupTableEntriesCard> = {
    component: LookupTableEntriesCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/AddressLookupTable/LookupTableEntriesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const samplePubkeys = [
    new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    new PublicKey('11111111111111111111111111111111'),
    new PublicKey('SysvarRent111111111111111111111111111111111'),
    new PublicKey('SysvarC1ock11111111111111111111111111111111'),
];

export const WithEntries: Story = {
    args: {
        parsedLookupTable: {
            addresses: samplePubkeys,
        } as any,
    },
};

export const Empty: Story = {
    args: {
        parsedLookupTable: { addresses: [] } as any,
    },
};
