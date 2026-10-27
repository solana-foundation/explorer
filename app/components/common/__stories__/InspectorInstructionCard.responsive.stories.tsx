import { withClusterAndAccounts, withScrollAnchor, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { InspectorInstructionCard } from '../InspectorInstructionCard';
import * as Base from './InspectorInstructionCard.stories';

const meta: Meta<typeof InspectorInstructionCard> = {
    component: InspectorInstructionCard,
    decorators: [withScrollAnchor, withTokenInfoBatch, withClusterAndAccounts, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InspectorInstructionCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Success.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
