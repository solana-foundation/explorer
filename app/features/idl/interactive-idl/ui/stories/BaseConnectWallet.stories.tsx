import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { BaseConnectWallet } from '../BaseConnectWallet';

const meta = {
    args: {
        onConnect: fn(),
        onDisconnect: fn(),
    },
    component: BaseConnectWallet,
    decorators: [
        Story => (
            <div
                style={{
                    width: '500px',
                }}
            >
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs'],
    title: 'Features/IDL/Interactive IDL/UI/BaseConnectWallet',
} satisfies Meta<typeof BaseConnectWallet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default disconnected state
 * Shows the wallet connection card when no wallet is connected
 */
export const Default: Story = {
    args: {
        connected: false,
        connecting: false,
    },
};

/**
 * Not connected state
 * Shows the connect wallet interface when no wallet is available
 */
export const NotConnected: Story = {
    args: {
        buttonState: 'no-wallet',
        connected: false,
        connecting: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the wallet selection interface when no wallet is available.',
            },
        },
    },
};

/**
 * Connecting state
 * Shows the component while a wallet connection is in progress
 */
export const Connecting: Story = {
    args: {
        buttonState: 'connecting',
        connected: false,
        connecting: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the component state while connecting to a wallet.',
            },
        },
    },
};

/**
 * Has wallet available state
 * Shows when a wallet is detected but not yet connected
 */
export const HasWallet: Story = {
    args: {
        buttonState: 'has-wallet',
        connected: false,
        connecting: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the component when a wallet is available for connection.',
            },
        },
    },
};

/**
 * Connected state
 * Shows the component when a wallet is successfully connected
 */
export const Connected: Story = {
    args: {
        address: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        connected: true,
        connecting: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the component with a connected wallet and address display.',
            },
        },
    },
};

/**
 * Disabled state
 * Shows the component when interaction is disabled
 */
export const Disabled: Story = {
    args: {
        connected: false,
        connecting: false,
        disabled: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows the component in a disabled state where no interaction is possible.',
            },
        },
    },
};
