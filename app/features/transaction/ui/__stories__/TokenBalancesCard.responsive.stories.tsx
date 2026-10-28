import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenBalancesCardInner } from '../TokenBalancesCard';
import * as Base from './TokenBalancesCard.stories';

const meta: Meta<typeof TokenBalancesCardInner> = {
    component: TokenBalancesCardInner,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Transaction/TokenBalancesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.Inner_MultipleRows;

export const Mobile: Story = { args, decorators, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, decorators, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, decorators, globals: { viewport: { isRotated: true, value: 'ipad' } } };
