import { withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenBalancesCardInner } from '../TokenBalancesCard';
import * as Base from './TokenBalancesCard.stories';

const meta: Meta<typeof TokenBalancesCardInner> = {
    component: TokenBalancesCardInner,
    decorators: [withTokenInfoBatch, withMockTransactions, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Transaction/TokenBalancesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Inner_MultipleRows.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
