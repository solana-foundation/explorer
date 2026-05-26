import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';

import { LookupTableEntriesCard } from '../LookupTableEntriesCard';

// Narrow Meta/Story to the `parsedLookupTable` arm of the component's union prop so args type-checks without an intersection collapse.
type ParsedArgs = { parsedLookupTable: AddressLookupTableAccountInfo };

const meta = {
    component: LookupTableEntriesCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/AddressLookupTable/LookupTableEntriesCard',
} satisfies Meta<ParsedArgs>;

export default meta;
type Story = StoryObj<ParsedArgs>;

const samplePubkeys = [
    new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    new PublicKey('11111111111111111111111111111111'),
    new PublicKey('SysvarRent111111111111111111111111111111111'),
    new PublicKey('SysvarC1ock11111111111111111111111111111111'),
];

const sampleLookupTable: AddressLookupTableAccountInfo = {
    addresses: samplePubkeys,
    deactivationSlot: BigInt('18446744073709551615'),
    lastExtendedSlot: 312_000_000,
    lastExtendedSlotStartIndex: 0,
};

export const WithEntries: Story = {
    args: { parsedLookupTable: sampleLookupTable },
};

export const Empty: Story = {
    args: { parsedLookupTable: { ...sampleLookupTable, addresses: [] } },
};
