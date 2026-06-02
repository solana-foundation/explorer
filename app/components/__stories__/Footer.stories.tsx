import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withCluster } from '../../../.storybook/decorators';
import { Footer } from '../Footer';

const meta = {
    component: Footer,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Layout/Footer',
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('(Beta)')).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'Terms of Services' })).toBeInTheDocument();
    },
};
