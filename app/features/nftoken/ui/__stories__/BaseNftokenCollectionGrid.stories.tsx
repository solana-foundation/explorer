import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { fn } from 'storybook/test';

import solanaHero from '@/app/components/shared/ui/image/__stories__/solana_hero_generated.jpg';

import { BaseNftokenCollectionGrid } from '../BaseNftokenCollectionGrid';
import { BaseNftokenTile } from '../BaseNftokenTile';

const meta = {
    component: BaseNftokenCollectionGrid,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/NFToken/NftokenCollectionGrid',
} satisfies Meta<typeof BaseNftokenCollectionGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onRefresh: fn(),
        refreshing: false,
        tiles: [
            <BaseNftokenTile
                key="loaded"
                href="/address/13KhhKUZBMTN6pQ9oVJMc3KrkALdBvWBAQXbL7nCiYWN"
                metadata={{ kind: 'loaded', metadata: { image: solanaHero.src, name: 'Genesis: friends.glow' } }}
            />,
            <BaseNftokenTile
                key="unavailable"
                href="/address/13Y9iPURvuUhugHqfPqAhWsiugoG3ahbA78k3sMS1Esn"
                metadata={{ kind: 'unavailable' }}
            />,
            <BaseNftokenTile
                key="loading"
                href="/address/13uXRxYbggzGwBoooLkgguhe1a7ALHhVDYfNhRHuH12h"
                metadata={{ kind: 'loading' }}
            />,
        ],
        undecodableCount: 0,
    },
};

export const WithUndecodableAccounts: Story = {
    args: { ...Default.args, undecodableCount: 2 },
};

export const Refreshing: Story = {
    args: { ...Default.args, refreshing: true },
};

export const Empty: Story = {
    args: { onRefresh: fn(), refreshing: false, tiles: [], undecodableCount: 0 },
};
