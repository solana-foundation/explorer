import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withStats } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';

import { LiveTransactionStatsCard } from '../LiveTransactionStatsCard';

const meta: Meta<typeof LiveTransactionStatsCard> = {
    component: LiveTransactionStatsCard,
    decorators: [withMockRpc, withStats],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/LiveTransactionStatsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
