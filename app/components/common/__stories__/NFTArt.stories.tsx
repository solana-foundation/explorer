import type { Meta, StoryObj } from '@storybook/react';

import { NFTImageContent } from '../NFTArt';

const meta = {
    tags: ['autodocs', 'test'],
    title: 'Components/Common/NFTArt',
} satisfies Meta;

export default meta;
type Story = StoryObj;

const SAMPLE_URI = 'https://arweave.net/sample-image.png';

export const WithUri: Story = {
    render: () => <NFTImageContent uri={SAMPLE_URI} />,
};

export const Placeholder: Story = {
    render: () => <NFTImageContent />,
};
