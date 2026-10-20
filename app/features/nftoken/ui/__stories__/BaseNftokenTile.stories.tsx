import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import solanaHero from '@/app/components/shared/ui/image/__stories__/solana_hero_generated.jpg';

import { BaseNftokenTile } from '../BaseNftokenTile';

const meta = {
    component: BaseNftokenTile,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/NFToken/NftokenTile',
} satisfies Meta<typeof BaseNftokenTile>;

export default meta;
type Story = StoryObj<typeof meta>;

const href = '/address/13KhhKUZBMTN6pQ9oVJMc3KrkALdBvWBAQXbL7nCiYWN';

export const Loading: Story = {
    args: { href, metadata: { kind: 'loading' } },
};

export const Loaded: Story = {
    args: { href, metadata: { kind: 'loaded', metadata: { image: solanaHero.src, name: 'Genesis: friends.glow' } } },
};

export const LoadedWithoutName: Story = {
    args: { href, metadata: { kind: 'loaded', metadata: { image: solanaHero.src, name: undefined } } },
};

export const Unavailable: Story = {
    args: { href, metadata: { kind: 'unavailable' } },
};

export const Failed: Story = {
    args: { href, metadata: { kind: 'failed' } },
};
