import { nextjsParameters, withStats } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { LiveTransactionStatsCard } from '../LiveTransactionStatsCard';

const meta: Meta<typeof LiveTransactionStatsCard> = {
    component: LiveTransactionStatsCard,
    decorators: [withMockRpc, withStats],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/LiveTransactionStatsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
