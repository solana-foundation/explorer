import type { Meta, StoryObj } from '@storybook/react';
import { responsiveDocsPage, withViewportFromGlobal } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { NFTImageContent } from '../NFTArt';

const SAMPLE_URI = 'https://arweave.net/sample-image.png';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        docs: { page: responsiveDocsPage },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs'],
    title: 'Components/Common/NFTArt/Responsive',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render: () => <NFTImageContent uri={SAMPLE_URI} />,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render: () => <NFTImageContent uri={SAMPLE_URI} />,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render: () => <NFTImageContent uri={SAMPLE_URI} />,
};
