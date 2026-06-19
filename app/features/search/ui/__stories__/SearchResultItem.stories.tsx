import type { Meta, StoryObj } from '@storybook-config/types';

import type { SearchItem } from '../../lib/types';
import { SearchResultItem } from '../SearchResultItem';

const meta: Meta<typeof SearchResultItem> = {
    component: SearchResultItem,
    tags: ['autodocs', 'test'],
    title: 'Features/Search/SearchResultItem',
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseItem: SearchItem = {
    label: 'USD Coin',
    pathname: '/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    sublabel: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    value: ['USD Coin', 'USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
};

export const Default: Story = {
    args: { option: baseItem },
};

export const Verified: Story = {
    args: { option: { ...baseItem, verified: true } },
};

export const VerifiedBuild: Story = {
    args: {
        option: {
            ...baseItem,
            label: 'Token Program',
            pathname: '/address/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA/verified-build',
            sublabel: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            verified: true,
        },
    },
};

export const WithoutSublabel: Story = {
    args: { option: { ...baseItem, sublabel: undefined } },
};

export const WithBrokenIcon: Story = {
    args: { option: { ...baseItem, icon: 'https://example.invalid/missing.png' } },
};
