import type { Meta, StoryObj } from '@storybook-config/types';

import { SimdLinks } from '../SimdLinks';

const meta: Meta<typeof SimdLinks> = {
    component: SimdLinks,
    tags: ['autodocs', 'test'],
    title: 'Features/FeatureGate/SimdLinks',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleEntry: Story = {
    args: {
        entries: [{ link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/123', simd: '123' }],
    },
};

export const MultipleEntries: Story = {
    args: {
        entries: [
            { link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/12', simd: '12' },
            { link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/123', simd: '123' },
            { link: 'https://github.com/solana-foundation/solana-improvement-documents/pull/1234', simd: '1234' },
        ],
    },
};

export const Empty: Story = {
    args: {
        entries: [],
    },
};
