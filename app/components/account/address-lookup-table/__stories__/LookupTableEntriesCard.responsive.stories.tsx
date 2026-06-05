import { DEFAULT_SLOT } from '@__fixtures__/gen';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';

import { LookupTableEntriesCard } from '../LookupTableEntriesCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
type ParsedArgs = { parsedLookupTable: AddressLookupTableAccountInfo };

const meta = {
    component: LookupTableEntriesCard,
    decorators: [withViewportFromGlobal, withCluster, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AddressLookupTable/LookupTableEntriesCard/Responsive',
} satisfies Meta<ParsedArgs>;

export default meta;
type Story = StoryObj<ParsedArgs>;

const samplePubkeys = [TOKEN_PROGRAM_ID, PublicKey.default, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY];

const args = {
    parsedLookupTable: {
        addresses: samplePubkeys,
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: DEFAULT_SLOT,
        lastExtendedSlotStartIndex: 0,
    } satisfies AddressLookupTableAccountInfo,
};

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
