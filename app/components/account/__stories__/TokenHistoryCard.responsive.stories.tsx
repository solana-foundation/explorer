import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenHistoryCard } from '../TokenHistoryCard';
import * as Base from './TokenHistoryCard.stories';

const meta: Meta<typeof TokenHistoryCard> = {
    component: TokenHistoryCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/TokenHistoryCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.InitialLoadPrompt.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
