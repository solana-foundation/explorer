import type { Meta, StoryObj } from '@storybook-config/types';

import { McpLandingView } from '../McpLandingView';

const meta: Meta<typeof McpLandingView> = {
    component: McpLandingView,
    tags: ['autodocs', 'test'],
    title: 'Features/McpLanding/McpLandingView',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
