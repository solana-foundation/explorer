import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { NormalMetaplexNFTAttributesCard } from '../MetaplexNFTAttributesCard';
import * as Base from './MetaplexNFTAttributesCard.stories';

const meta: Meta<typeof NormalMetaplexNFTAttributesCard> = {
    component: NormalMetaplexNFTAttributesCard,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/MetaplexNFTAttributesCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.WithAttributes;

export const Mobile: Story = { args, decorators, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, decorators, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, decorators, globals: { viewport: { isRotated: true, value: 'ipad' } } };
