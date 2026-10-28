import { withStats } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { StatsNotReady } from '../StatsNotReady';

const meta: Meta<typeof StatsNotReady> = {
    component: StatsNotReady,
    decorators: [withStats],
    tags: ['autodocs', 'test'],
    title: 'Components/StatsNotReady',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
    args: { error: false },
};

export const Error: Story = {
    args: { error: true },
};
