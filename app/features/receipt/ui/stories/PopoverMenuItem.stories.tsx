import type { Meta, StoryObj } from '@storybook/react';
import { Link } from 'react-feather';
import { expect, fn, userEvent, within } from 'storybook/test';

import { PopoverMenuItem } from '../PopoverMenuItem';

const meta: Meta<typeof PopoverMenuItem> = {
    args: {
        icon: <Link size={11} />,
        label: 'Copy link',
        onClick: fn(),
    },
    component: PopoverMenuItem,
    tags: ['autodocs', 'test'],
    title: 'Features/Receipt/PopoverMenuItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        // eslint-disable-next-line no-restricted-syntax -- case-insensitive accessible name match for testing-library query
        const button = canvas.getByRole('button', { name: /copy link/i });
        await expect(button).toBeInTheDocument();

        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};
