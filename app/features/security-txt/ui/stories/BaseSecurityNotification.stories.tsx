import type { Meta, StoryObj } from '@storybook/react';

import { BaseSecurityNotification } from '../BaseSecurityNotificaton';

const meta = {
    component: BaseSecurityNotification,
    decorators: [
        Story => (
            <div>
                <Story />
            </div>
        ),
    ],
    parameters: {
        backgrounds: {
            default: 'Card',
        },
        docs: {
            description: {
                story: 'Notification component displaying security.txt messages',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/SecurityTxt/BaseSecurityNotification',
} satisfies Meta<typeof BaseSecurityNotification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        message: 'This is a security notification from security.txt',
    },
    parameters: {
        docs: {
            description: {
                story: 'Default security notification with a standard message',
            },
        },
    },
};

export const LongMessage: Story = {
    args: {
        message:
            'This is a longer security notification message that contains more detailed information about the security policy, vulnerability disclosure process, and contact information for security researchers. It may span multiple lines and provide comprehensive guidance.',
    },
    parameters: {
        docs: {
            description: {
                story: 'Notification with a longer, more detailed message',
            },
        },
    },
};

export const WithSpecialCharacters: Story = {
    args: {
        message:
            'Security contact: security@example.com | PGP: https://example.com/pgp. Visit https://example.com/security for more info.',
    },
    parameters: {
        docs: {
            description: {
                story: 'Notification with special characters, URLs, and email addresses',
            },
        },
    },
};

export const MultilineMessage: Story = {
    args: {
        message:
            'Security Policy:\n\n1. Report vulnerabilities responsibly\n2. Allow 90 days for fixes\n3. Do not disclose publicly before fix',
    },
    parameters: {
        docs: {
            description: {
                story: 'Notification with a multiline message',
            },
        },
    },
};
