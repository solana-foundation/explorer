import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import type { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';

import { LookupTableEntriesCard } from '../LookupTableEntriesCard';
import * as Base from './LookupTableEntriesCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
type ParsedArgs = { parsedLookupTable: AddressLookupTableAccountInfo };

const meta = {
    component: LookupTableEntriesCard,
    decorators: [withViewportFromGlobal, withCluster, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AddressLookupTable/LookupTableEntriesCard@Media',
} satisfies Meta<ParsedArgs>;

export default meta;
type Story = StoryObj<ParsedArgs>;

const args = Base.WithEntries.args;

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
