import type { Meta, StoryObj } from '@storybook/react';
import { withImageLoadPending } from '@storybook-config/decorators';
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

// Happy path: the proxied image loads and is shown as-is.
export const Loaded: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 }, uri: solanaHero.src },
};

// Same, plus the opt-in "View original" escape-hatch link beneath the image.
// The link only renders for a real http(s) `uri` (its guard drops non-absolute
// hrefs), so `uri` is an external URL for the link while `getProxiedUri` points
// the displayed image at the bundled asset.
export const WithOriginalLink: Story = {
    args: {
        alt: 'nft',
        getProxiedUri: () => solanaHero.src,
        showOriginalLink: true,
        style: { height: 120, width: 120 },
        uri: 'https://example.com/nft.png',
    },
    play: async ({ canvasElement }) => {
        expect(within(canvasElement).getByRole('link', { name: 'View original' })).toBeInTheDocument();
    },
};

// The default fallback is a logo-only placeholder with the failure reason as a
// tooltip — and no "View original" link unless the consumer opts in. The src is
// a raw cross-origin URL here, so there's no readable status: the reason is the
// generic one.
export const Fallback: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 }, uri: 'https://invalid.example/missing.png' },
    // Hold the image pending so the real cross-origin error can't fire before the
    // synthetic one below — the synthetic dispatch alone drives the failure state.
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByAltText('nft').dispatchEvent(new Event('error'));
        // The placeholder announces the reason (alt) and shows it on hover (title).
        const fallback = await canvas.findByAltText('Image could not be displayed');
        expect(fallback).toHaveAttribute('title', 'Image could not be displayed');
        expect(canvas.queryByRole('link', { name: 'View original' })).toBeNull();
    },
};

// A same-origin proxy URL whose on-error probe reads a 413: the reason shows on
// the fallback logo's tooltip and, with `showOriginalLink`, in the link's info
// tooltip (its trigger label). The copy is generic ("maximum size"), not the cap.
// The 413 stub lives in `beforeEach` (not `play`) so the oversize state renders
// whether you run the interaction or just view the story — otherwise the dead
// /api/metadata/proxy path would 404 and the story would show "not found".
export const FallbackOversize: Story = {
    args: {
        alt: 'nft',
        getProxiedUri: (uri: string) => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`,
        showOriginalLink: true,
        style: { height: 120, width: 120 },
        uri: 'https://example.test/oversize.png',
    },
    beforeEach: () => {
        const originalFetch = window.fetch;
        window.fetch = (() => Promise.resolve(new Response(null, { status: 413 }))) as typeof fetch;
        return () => {
            window.fetch = originalFetch;
        };
    },
    // Hold the image pending so the real /api/metadata/proxy 404 can't fire before
    // the synthetic error; the on-error probe still reads the stubbed 413 above.
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByAltText('nft').dispatchEvent(new Event('error'));
        expect(
            await canvas.findByRole('button', {
                name: 'Image exceeds maximum size. Clicking this link will open an external resource',
            }),
        ).toBeInTheDocument();
        expect(canvas.getByRole('link', { name: 'View original' })).toBeInTheDocument();
        expect(canvas.getByAltText('Image exceeds maximum size')).toHaveAttribute(
            'title',
            'Image exceeds maximum size',
        );
    },
};

// With `showOriginalLink`, the escape-hatch link sits beneath the fallback logo;
// the reason rides in its info tooltip, not the link text. The src is cross-origin
// here, so the reason is the generic "Image could not be displayed".
export const FallbackWithOriginalLink: Story = {
    args: {
        alt: 'nft',
        showOriginalLink: true,
        style: { height: 120, width: 120 },
        uri: 'https://invalid.example/missing.png',
    },
    // Hold the image pending so only the synthetic error drives the failure state.
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByAltText('nft').dispatchEvent(new Event('error'));
        expect(
            await canvas.findByRole('button', {
                name: 'Image could not be displayed. Clicking this link will open an external resource',
            }),
        ).toBeInTheDocument();
        expect(canvas.getByRole('link', { name: 'View original' })).toBeInTheDocument();
    },
};

// A skeleton holds the slot while the proxied image loads. Held pending so the
// skeleton is what's shown — otherwise the bundled image resolves instantly and
// the skeleton is gone before it can be seen. The clear-on-load swap is covered
// by ImageWithFallback's unit test.
export const Loading: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 }, uri: solanaHero.src },
    decorators: [withImageLoadPending],
    play: async ({ canvasElement }) => {
        expect(canvasElement.querySelector('.e-animate-pulse')).not.toBeNull();
    },
};

// No `uri`: nothing is fetched and the slot shows the decorative Solana
// placeholder — no failure, so no reason/tooltip and no link.
export const NoImage: Story = {
    args: { alt: 'nft', style: { height: 120, width: 120 } },
};
