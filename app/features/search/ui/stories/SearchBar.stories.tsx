import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';

import { computeFilterArgs } from '../../lib/filter-tabs';
import type { SearchOptions } from '../../lib/types';
import { BaseSearch, type BaseSearchProps } from '../BaseSearch';

const defaultArgs: BaseSearchProps = {
    ...computeFilterArgs([]),
    isLoading: false,
    onFilterChange: fn(),
    onOpenChange: fn(),
    onSelect: fn(),
    onValueChange: fn(),
    open: false,
    value: '',
};

const meta: Meta<typeof BaseSearch> = {
    args: defaultArgs,
    component: BaseSearch,
    parameters: {
        layout: 'padded',
    },
    title: 'Features/Search/BaseSearch',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox');
        expect(input).toBeInTheDocument();

        const placeholder = canvas.getByPlaceholderText('Search for tokens, validators, programs, and accounts');
        expect(placeholder).toBeInTheDocument();
    },
};

export const TypeAndClear: Story = {
    name: 'Type and Clear',
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('combobox');

        expect(input).toBeVisible();
        expect(input).toBeEnabled();

        await userEvent.click(input);
        expect(input).toHaveFocus();

        await userEvent.type(input, 'test');
        expect(args.onValueChange).toHaveBeenCalled();
        expect(args.onOpenChange).toHaveBeenCalledWith(true);
    },
};

const tokenResults: SearchOptions[] = [
    {
        label: 'Tokens',
        options: [
            { label: 'Token A', pathname: '/address/tokenA', value: ['token-a'] },
            { label: 'Token B', pathname: '/address/tokenB', value: ['token-b'] },
        ],
    },
];

export const WithResults: Story = {
    args: {
        ...computeFilterArgs(tokenResults),
        open: true,
        value: 'token',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Tokens', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('Token A')).toBeInTheDocument();
        expect(canvas.getByText('Token B')).toBeInTheDocument();
    },
};

export const Loading: Story = {
    args: {
        isLoading: true,
        open: true,
        value: 'loading query',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Searching...')).toBeInTheDocument();
        expect(canvas.queryByText('No results found')).not.toBeInTheDocument();
    },
};

export const NoResults: Story = {
    args: {
        isLoading: false,
        open: true,
        value: 'xyz123',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('No results found')).toBeInTheDocument();
        expect(canvas.queryByText('Searching...')).not.toBeInTheDocument();
    },
};

export const SelectResult: Story = {
    args: {
        ...computeFilterArgs(tokenResults),
        open: true,
        value: 'token',
    },
    name: 'Select Result',
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const item = canvas.getByText('Token A');
        expect(item).toBeInTheDocument();

        await userEvent.click(item);
        expect(args.onSelect).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'Token A', pathname: '/address/tokenA' }),
        );
    },
};

export const KeyboardHint: Story = {
    name: 'Keyboard Hint',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const kbd = canvas.getByText('/');
        expect(kbd).toBeInTheDocument();
        expect(kbd.tagName).toBe('KBD');
    },
};

const multiGroupResults: SearchOptions[] = [
    {
        label: 'Accounts',
        options: [{ label: 'Solana Foundation', pathname: '/address/solFoundation', value: ['solana-foundation'] }],
    },
    {
        label: 'Programs',
        options: [{ label: 'Solana Token Program', pathname: '/address/splToken', value: ['spl-token'] }],
    },
    {
        label: 'Tokens',
        options: [{ label: 'Wrapped SOL', pathname: '/address/wSol', value: ['wsol'] }],
    },
];

export const MultipleGroups: Story = {
    args: {
        ...computeFilterArgs(multiGroupResults),
        open: true,
        value: 'sol',
    },
    name: 'Multiple Groups',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Accounts', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('Programs', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('Tokens', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('Solana Foundation')).toBeInTheDocument();
        expect(canvas.getByText('Solana Token Program')).toBeInTheDocument();
        expect(canvas.getByText('Wrapped SOL')).toBeInTheDocument();
    },
};

const iconResults: SearchOptions[] = [
    {
        label: 'Tokens',
        options: [
            {
                icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                label: 'USDC - USD Coin',
                pathname: '/address/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                value: ['usdc', 'USD Coin', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
                verified: true,
            },
            {
                label: 'USDT - Tether USD',
                pathname: '/address/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                value: ['usdt', 'Tether USD', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'],
                verified: false,
            },
        ],
    },
    {
        label: 'Programs',
        options: [
            {
                label: 'Token Program',
                pathname: '/address/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                value: ['token'],
            },
        ],
    },
];

export const WithIconsAndBadges: Story = {
    args: {
        ...computeFilterArgs(iconResults),
        open: true,
        value: 'usdc',
    },
    name: 'With Icons and Badges',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByText('Tokens', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('Programs', { selector: 'span' })).toBeInTheDocument();
        expect(canvas.getByText('USDC - USD Coin')).toBeInTheDocument();
        expect(canvas.getByText('USDT - Tether USD')).toBeInTheDocument();
        expect(canvas.getByText('Token Program')).toBeInTheDocument();
    },
};
