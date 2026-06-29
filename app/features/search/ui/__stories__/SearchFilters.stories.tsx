import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import { FILTER_TABS } from '../../lib/filter-tabs';
import { SearchFilters } from '../SearchFilters';

const meta: Meta<typeof SearchFilters> = {
    args: {
        onFilterChange: fn(),
        tabs: FILTER_TABS,
    },
    component: SearchFilters,
    tags: ['autodocs', 'test'],
    title: 'Features/Search/SearchFilters',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllActive: Story = {
    args: {
        activeFilter: 'all',
        counts: { all: 12, 'feature-gates': 1, other: 4, programs: 3, tokens: 4 },
    },
};

export const TokensActive: Story = {
    args: {
        activeFilter: 'tokens',
        counts: { all: 12, 'feature-gates': 1, other: 4, programs: 3, tokens: 4 },
    },
};

export const ZeroCountsExceptAll: Story = {
    args: {
        activeFilter: 'all',
        counts: { all: 0, 'feature-gates': 0, other: 0, programs: 0, tokens: 0 },
    },
};
