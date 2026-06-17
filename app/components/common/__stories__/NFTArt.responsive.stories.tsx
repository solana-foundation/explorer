import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { NFTImageContent } from '../NFTArt';

const SAMPLE_URI = 'https://arweave.net/sample-image.png';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/NFTArt@Media',
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
