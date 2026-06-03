import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withMockRpc, withStats } from '@storybook-config/decorators';

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
