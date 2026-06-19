import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenMintHeaderCard } from '../AccountHeader';

const meta: Meta<typeof TokenMintHeaderCard> = {
    component: TokenMintHeaderCard,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AccountHeader/TokenMintHeaderCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLogo: Story = {
    args: {
        token: {
            logoURI:
                'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
            name: 'USD Coin',
            symbol: 'USDC',
        },
    },
};

export const WithoutLogo: Story = {
    args: {
        token: {
            logoURI: undefined,
            name: 'Some Token',
            symbol: 'TKN',
        },
    },
};

export const UnknownToken: Story = {
    args: {
        token: { logoURI: undefined, name: undefined, symbol: undefined },
    },
};

export const NoSymbol: Story = {
    args: {
        token: { logoURI: undefined, name: 'Named Token', symbol: undefined },
    },
};

export const LongName: Story = {
    args: {
        token: {
            logoURI: undefined,
            name: 'A Very Long Token Name That Tests Header Overflow Behavior',
            symbol: 'LONGNAME',
        },
    },
};
