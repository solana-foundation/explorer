import type { Meta, StoryObj } from '@storybook-config/types';

import { SearchGroupHeading } from '../SearchGroupHeading';

const meta: Meta<typeof SearchGroupHeading> = {
    component: SearchGroupHeading,
    tags: ['autodocs', 'test'],
    title: 'Features/Search/SearchGroupHeading',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {
    args: { label: 'Tokens' },
};

export const Programs: Story = {
    args: { label: 'Programs' },
};

export const FeatureGates: Story = {
    args: { label: 'Feature Gates' },
};
