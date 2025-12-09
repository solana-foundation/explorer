import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseConnectWalletButton } from '../BaseConnectWalletButton';

const meta = {
    args: {
        onClick: fn(),
    },
    component: BaseConnectWalletButton,
    tags: ['autodocs'],
    title: 'Features/IDL/Interactive IDL/UI/BaseConnectWalletButton',
} satisfies Meta<typeof BaseConnectWalletButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story - shows the component with a standard wallet address
 */
export const Default: Story = {
    args: {
        displayAddress: '1A2B..3C4D',
    },
};

/**
 * Standard truncated address format
 * Shows how the component displays a typical truncated Solana address
 */
export const StandardAddress: Story = {
    args: {
        displayAddress: 'AbCdE..FgHiJ',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows a standard truncated wallet address format.',
            },
        },
    },
};

/**
 * Long address format
 * Demonstrates how the component handles longer display addresses
 */
export const LongAddress: Story = {
    args: {
        displayAddress: 'ABC123..DEF789XYZ',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows how the component handles longer address formats.',
            },
        },
    },
};

/**
 * Short address format
 * Shows component with a minimal address display
 */
export const ShortAddress: Story = {
    args: {
        displayAddress: '9x..3z',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows component with a minimal address format.',
            },
        },
    },
};

/**
 * Full address display
 * Shows component when displaying a full or nearly full address
 */
export const FullAddress: Story = {
    args: {
        displayAddress: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows component displaying a full or nearly full address.',
            },
        },
    },
};

/**
 * Interactive story with click handler
 * Demonstrates the onClick functionality and includes a play test
 */
export const WithClickHandler: Story = {
    args: {
        displayAddress: '12ni1..Ndia8',
    },
    parameters: {
        docs: {
            description: {
                story: 'Interactive version that demonstrates click handling. Check the Actions panel to see click events.',
            },
        },
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button');

        // Test that the button is clickable
        await expect(button).toBeInTheDocument();

        // Click the button and verify the onClick handler was called
        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledTimes(1);

        // Click again to verify multiple clicks work
        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledTimes(2);
    },
};
