import solanaLogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { withImageLoadPending } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { Skeleton } from '../../skeleton';
import { ImageWithFallback } from '../ImageWithFallback';
import solanaHero from './solana_hero_generated.jpg';

// Solana logo used as the placeholder shown when an image can't be displayed.
const SolanaPlaceholder = (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="Solana" src={solanaLogo.src} style={{ height: 120, width: 120 }} />
);

const meta: Meta<typeof ImageWithFallback> = {
    component: ImageWithFallback,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/ImageWithFallback',
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
    // Hold the image pending so the real load failure can't beat the synthetic one
    // below — the synthetic error alone drives the swap to the fallback.
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Simulate the load failure the broken URL produces.
        canvas.getByAltText('broken').dispatchEvent(new Event('error'));
        expect(await canvas.findByAltText('Solana')).toBeInTheDocument();
    },
};

// The placeholder holds the slot while the image loads; the <img> stays mounted
// (hidden) underneath so it can still fetch. A pulsing Skeleton is used here (the
// same loading view consumers like ProxiedImage pass), held pending so it's what's
// shown — the swap-out-on-load is covered in the unit test.
export const Placeholder: Story = {
    args: {
        alt: 'loading',
        placeholder: <Skeleton data-testid="placeholder" style={{ height: 120, width: 120 }} />,
        src: solanaHero.src,
        style: { height: 120, width: 120 },
    },
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByTestId('placeholder')).toBeInTheDocument();
    },
};

// Empty src renders the fallback immediately, without waiting for a load error.
export const EmptySource: Story = {
    args: {
        fallback: SolanaPlaceholder,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(await canvas.findByAltText('Solana')).toBeInTheDocument();
    },
};
