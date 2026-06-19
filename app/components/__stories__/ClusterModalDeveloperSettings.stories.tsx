import type { Meta, StoryObj } from '@storybook-config/types';

import ClusterModalDeveloperSettings from '../ClusterModalDeveloperSettings';

const meta = {
    component: ClusterModalDeveloperSettings,
    tags: ['autodocs', 'test'],
    title: 'Components/ClusterModalDeveloperSettings',
} satisfies Meta<typeof ClusterModalDeveloperSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
