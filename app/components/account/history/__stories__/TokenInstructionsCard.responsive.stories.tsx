import { withHistory } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenInstructionsCard } from '../TokenInstructionsCard';
import * as Base from './TokenInstructionsCard.stories';

const meta: Meta<typeof TokenInstructionsCard> = {
    component: TokenInstructionsCard,
    decorators: [withHistory, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenInstructionsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const { args, parameters } = Base.WithSignatures;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } }, parameters };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } }, parameters };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } }, parameters };
