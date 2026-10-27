import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseDomainsCard } from '../BaseDomainsCard';
import * as Base from './BaseDomainsCard.stories';

const meta: Meta<typeof BaseDomainsCard> = {
    component: BaseDomainsCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Entities/Domain/BaseDomainsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.MultipleDomains.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
