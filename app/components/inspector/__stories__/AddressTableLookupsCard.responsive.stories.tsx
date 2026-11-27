import { withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { AddressTableLookupsCard } from '../AddressTableLookupsCard';
import * as Base from './AddressTableLookupsCard.stories';

const meta: Meta<typeof AddressTableLookupsCard> = {
    component: AddressTableLookupsCard,
    decorators: [withTokenInfoBatch, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/AddressTableLookupsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.WithResolvedAddresses;

export const Mobile: Story = { args, decorators, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, decorators, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, decorators, globals: { viewport: { isRotated: true, value: 'ipad' } } };
