import type { Meta, StoryObj } from '@storybook/react';

import { DeveloperResources } from '../DeveloperResources';

const meta: Meta<typeof DeveloperResources> = {
    component: DeveloperResources,
    title: 'Components/DeveloperResources',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
