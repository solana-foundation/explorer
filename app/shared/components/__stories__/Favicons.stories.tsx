import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

type FaviconAsset = {
    src: string;
    label: string;
    /** Declared size, matching public/manifest.json and app/layout.tsx. */
    size: string;
    /** Rendered box in px; caps very large icons so the grid stays readable. */
    display: number;
    purpose?: 'maskable';
};

// Kept in sync with public/manifest.json and the <link> tags in app/layout.tsx.
const FAVICONS: FaviconAsset[] = [
    { display: 32, label: 'favicon.ico', size: 'any', src: '/favicon.ico' },
    { display: 96, label: 'favicon.svg', size: 'any', src: '/favicon.svg' },
    { display: 96, label: 'favicon.png', size: '96×96', src: '/favicon.png' },
    { display: 48, label: 'icon-48.png', size: '48×48', src: '/icon-48.png' },
    { display: 72, label: 'icon-72.png', size: '72×72', src: '/icon-72.png' },
    { display: 96, label: 'icon-96.png', size: '96×96', src: '/icon-96.png' },
    { display: 128, label: 'icon-128.png', size: '128×128', src: '/icon-128.png' },
    { display: 128, label: 'icon-144.png', size: '144×144', src: '/icon-144.png' },
    { display: 128, label: 'icon-152.png', size: '152×152', src: '/icon-152.png' },
    { display: 128, label: 'icon-192.png', size: '192×192', src: '/icon-192.png' },
    { display: 128, label: 'icon-256.png', size: '256×256', src: '/icon-256.png' },
    { display: 128, label: 'icon-384.png', size: '384×384', src: '/icon-384.png' },
    { display: 128, label: 'icon-512.png', size: '512×512', src: '/icon-512.png' },
    { display: 96, label: 'apple-touch-icon.png', size: '180×180', src: '/apple-touch-icon.png' },
    {
        display: 128,
        label: 'icon-maskable-192.png',
        purpose: 'maskable',
        size: '192×192',
        src: '/icon-maskable-192.png',
    },
    {
        display: 128,
        label: 'icon-maskable-512.png',
        purpose: 'maskable',
        size: '512×512',
        src: '/icon-maskable-512.png',
    },
];

function FaviconTile({ asset }: { asset: FaviconAsset }) {
    return (
        <figure className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="flex h-32 w-32 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- static asset gallery, not app UI */}
                <img
                    alt={asset.label}
                    height={asset.display}
                    src={asset.src}
                    style={{ height: asset.display, width: asset.display }}
                    width={asset.display}
                />
            </div>
            <figcaption className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-gray-900">{asset.label}</span>
                <span className="text-xs text-gray-500">{asset.size}</span>
                {asset.purpose ? <span className="text-xs text-gray-400">{asset.purpose}</span> : null}
            </figcaption>
        </figure>
    );
}

function FaviconGallery() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {FAVICONS.map(asset => (
                <FaviconTile key={asset.label} asset={asset} />
            ))}
        </div>
    );
}

const meta = {
    component: FaviconGallery,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs', 'test'],
    title: 'Branding/Favicons',
} satisfies Meta<typeof FaviconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSizes: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const asset of FAVICONS) {
            expect(canvas.getByAltText(asset.label)).toBeInTheDocument();
        }
    },
};
