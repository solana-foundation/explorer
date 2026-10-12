import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import React from 'react';

import { PageHeader } from '../PageHeader';
import { PageLayout } from '../PageLayout';
import { PageSections } from '../PageSections';

// The page shell and its block rhythm switch at `lg` (992px): mobile tiers below, desktop at and
// above. These variants pin a viewport so the per-tier padding and between-blocks spacing are
// visible without resizing the window by hand.
const meta = {
    component: PageLayout,
    decorators: [withViewportFromGlobal],
    globals: { backgrounds: { value: 'dark' } },
    parameters: {
        layout: 'fullscreen',
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Design System/Page Layout@Media',
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

function Block({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-solid border-heavy-metal-950 bg-heavy-metal-800 px-6 py-8 text-sm text-neutral-200">
            {children}
        </div>
    );
}

const render = () => (
    <div className="min-h-screen bg-heavy-metal-900 py-8">
        <PageLayout>
            <PageHeader eyebrow="Details" title="Transaction" />
            <PageSections>
                <Block>Summary</Block>
                <Block>Accounts</Block>
                <Block>Instructions</Block>
            </PageSections>
        </PageLayout>
    </div>
);

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};
