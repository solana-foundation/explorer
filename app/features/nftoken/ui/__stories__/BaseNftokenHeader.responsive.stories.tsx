import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import solanaHero from '@/app/components/shared/ui/image/__stories__/solana_hero_generated.jpg';

import { BaseNftokenHeader } from '../BaseNftokenHeader';

const meta = {
    component: BaseNftokenHeader,
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/NFToken/NftokenHeader@Media',
} satisfies Meta<typeof BaseNftokenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    kind: 'nft',
    metadata: { kind: 'loaded', metadata: { image: solanaHero.src, name: 'Genesis: friends.glow' } },
    mutable: true,
} as const;

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
