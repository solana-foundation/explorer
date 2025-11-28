import type { Meta, StoryObj } from '@storybook/react';

import { TxSuccessStatus } from '../TxSuccessStatus';

const meta = {
    component: TxSuccessStatus,
    decorators: [
        Story => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '100%',
                    width: '800px',
                }}
            >
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    title: 'Entities/Program Logs/UI/TxSuccessStatus',
} satisfies Meta<typeof TxSuccessStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        date: new Date('2024-01-15T10:30:00Z'),
        link: `/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW`,
        signature: '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
    },
};

export const Recent: Story = {
    args: {
        date: new Date(),
        link: `/tx/3xK8vJ2mN9pQrS7tUvW5yZ1aBcD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8cD0eF2gH4iJ6kL8mN0oP2qR`,
        signature: '3xK8vJ2mN9pQrS7tUvW5yZ1aBcD4eF6gH8iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8cD0eF2gH4iJ6kL8mN0oP2qR',
    },
};

export const LongSignature: Story = {
    args: {
        date: new Date('2024-01-15T10:30:00Z'),
        link: `/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW`,
        signature:
            '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
    },
};
