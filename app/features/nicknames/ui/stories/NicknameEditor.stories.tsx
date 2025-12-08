import type { Meta, StoryObj } from '@storybook/react';

import { NicknameEditor } from '../NicknameEditor';

const meta = {
    component: NicknameEditor,
    decorators: [
        Story => (
            <div style={{ height: '100vh', width: '100vw' }}>
                <Story />
            </div>
        ),
    ],
    parameters: {
        docs: {
            description: {
                story: 'Modal for editing wallet address nicknames stored in localStorage',
            },
        },
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs'],
    title: 'Features/Nicknames/NicknameEditor',
} satisfies Meta<typeof NicknameEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        address: 'DXhYDXhYDXhYDXhYDXhYDXhYDXhYDXhYDXhYDXhYDXhY',
        onClose: () => console.log('Close clicked'),
    },
};

export const WithExistingNickname: Story = {
    args: {
        address: 'So11111111111111111111111111111111111111112',
        onClose: () => console.log('Close clicked'),
    },
    beforeEach: () => {
        // Set up a nickname in localStorage for this story
        if (typeof window !== 'undefined') {
            const nicknames = { So11111111111111111111111111111111111111112: 'SOL Token' };
            localStorage.setItem('solana-explorer-nicknames', JSON.stringify(nicknames));
        }
    },
};

export const LongAddress: Story = {
    args: {
        address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        onClose: () => console.log('Close clicked'),
    },
};
