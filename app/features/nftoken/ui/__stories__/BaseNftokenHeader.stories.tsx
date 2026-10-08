import type { Meta, StoryObj } from '@storybook-config/types';

import solanaHero from '@/app/components/shared/ui/image/__stories__/solana_hero_generated.jpg';

import { BaseNftokenHeader } from '../BaseNftokenHeader';

const meta = {
    component: BaseNftokenHeader,
    tags: ['autodocs', 'test'],
    title: 'Features/NFToken/NftokenHeader',
} satisfies Meta<typeof BaseNftokenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const loaded = { kind: 'loaded', metadata: { image: solanaHero.src, name: 'Genesis: friends.glow' } } as const;

export const NftMutable: Story = {
    args: { kind: 'nft', metadata: loaded, mutable: true },
};

export const NftImmutable: Story = {
    args: { kind: 'nft', metadata: loaded, mutable: false },
};

export const CollectionMutable: Story = {
    args: { kind: 'collection', metadata: loaded, mutable: true },
};

export const CollectionImmutable: Story = {
    args: { kind: 'collection', metadata: loaded, mutable: false },
};

export const Loading: Story = {
    args: { kind: 'collection', metadata: { kind: 'loading' }, mutable: true },
};

export const MetadataUnavailable: Story = {
    args: { kind: 'collection', metadata: { kind: 'unavailable' }, mutable: true },
};

export const MetadataFailed: Story = {
    args: { kind: 'collection', metadata: { kind: 'failed' }, mutable: true },
};
