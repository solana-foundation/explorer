import { withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { OwnedTokensCard } from '../OwnedTokensCard';
import * as Base from './OwnedTokensCard.stories';

const meta: Meta<typeof OwnedTokensCard> = {
    component: OwnedTokensCard,
    decorators: [withTokenInfoBatch, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/OwnedTokensCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.WithHoldings;

export const Mobile: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    decorators,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
