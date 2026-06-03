import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import solanaHero from '@/app/components/shared/ui/image/stories/solana_hero_generated.jpg';

import { ProxiedImage } from '../ProxiedImage';

// Storybook has no proxy backend, so inject an identity resolver: `uri` is
// rendered directly rather than rewritten to a dead /api/metadata/proxy request.
const meta: Meta<typeof ProxiedImage> = {
    args: { getProxiedUri: (uri: string) => uri },
    component: ProxiedImage,
    tags: ['autodocs'],
    title: 'Features/Metadata/ProxiedImage',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 }, uri: solanaHero.src },
};

export const WithOriginalLink: Story = {
    args: { alt: 'nft', showOriginalLink: true, style: { height: 120, width: 120 }, uri: solanaHero.src },
};

export const Fallback: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 }, uri: 'https://invalid.example/missing.png' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByAltText('nft').dispatchEvent(new Event('error'));
        expect(await canvas.findByRole('link', { name: 'View original' })).toBeInTheDocument();
    },
};

export const NoImage: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 } },
};
