import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { BaseDomainsCard } from '../BaseDomainsCard';

const meta = {
    component: BaseDomainsCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Entities/Domain/UI/BaseDomainsCard',
} satisfies Meta<typeof BaseDomainsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleDomain: Story = {
    args: {
        domains: [{ address: '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo', name: 'example.sol' }],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('example.sol')).toBeInTheDocument();
    },
};

export const MultipleDomains: Story = {
    args: {
        domains: [
            { address: '5ASxtmcPKDeD8NoE5QpskizPokqDdX1qHFiqZb1spLdo', name: 'example.sol' },
            { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', name: 'bob.sol' },
            { address: 'Sysvar1111111111111111111111111111111111111', name: 'charlie.ans' },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('example.sol')).toBeInTheDocument();
        expect(canvas.getByText('bob.sol')).toBeInTheDocument();
        expect(canvas.getByText('charlie.ans')).toBeInTheDocument();
    },
};
