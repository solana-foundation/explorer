import solanaLogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ImageWithFallback } from '../ImageWithFallback';
import solanaHero from './solana_hero_generated.jpg';

// Solana logo used as the placeholder shown when an image can't be displayed.
const SolanaPlaceholder = (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="Solana" src={solanaLogo.src} style={{ height: 120, width: 120 }} />
);

const meta: Meta<typeof ImageWithFallback> = {
    component: ImageWithFallback,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/ImageWithFallback',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
    args: {
        alt: 'hero',
        src: solanaHero.src,
        style: { height: 120, width: 120 },
    },
};

export const WithFallback: Story = {
    args: {
        alt: 'broken',
        fallback: SolanaPlaceholder,
        src: 'https://invalid.example/missing.png',
        style: { height: 120, width: 120 },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Simulate the load failure the broken URL produces.
        canvas.getByAltText('broken').dispatchEvent(new Event('error'));
        expect(await canvas.findByAltText('Solana')).toBeInTheDocument();
    },
};

// Empty src renders the placeholder immediately, without waiting for a load error.
export const EmptySource: Story = {
    args: {
        fallback: SolanaPlaceholder,
    },
};
