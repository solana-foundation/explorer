import type { Meta, StoryObj } from '@storybook-config/types';

import { VerifiedBadge } from '../VerifiedBadge';

const meta: Meta<typeof VerifiedBadge> = {
    component: VerifiedBadge,
    tags: ['autodocs', 'test'],
    title: 'Features/Search/VerifiedBadge',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
