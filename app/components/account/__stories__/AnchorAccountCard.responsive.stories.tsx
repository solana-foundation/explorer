import { withCluster } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { AnchorAccountCard } from '../AnchorAccountCard';
import * as Base from './AnchorAccountCard.stories';

const meta: Meta<typeof AnchorAccountCard> = {
    component: AnchorAccountCard,
    decorators: [withCluster, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AnchorAccountCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.NoIdl.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
