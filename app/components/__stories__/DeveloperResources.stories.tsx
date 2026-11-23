import type { Meta, StoryObj } from '@storybook-config/types';

import { DeveloperResources } from '../DeveloperResources';

const meta: Meta<typeof DeveloperResources> = {
    component: DeveloperResources,
    tags: ['autodocs', 'test'],
    title: 'Components/DeveloperResources',
};

export default meta;
type Story = StoryObj<typeof meta>;

// The default links: their previews are drawn in place, so nothing loads from outside.
export const Default: Story = {};
