import { DispatchContext as TokensDispatch, type State as TokensState, StateContext as TokensStateCtx } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { ClusterProvider } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';
import React from 'react';

import { OwnedTokensCard } from '../OwnedTokensCard';

const ADDRESS = '11111111111111111111111111111111';
const noop = () => undefined;

const tokensState = (entries: TokensState['entries']): TokensState => ({
    entries,
    url: 'https://api.mainnet-beta.solana.com',
});

const sampleTokensEntry = {
    data: {
        tokens: [
            {
                info: {
                    isNative: false,
                    mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                    owner: new PublicKey(ADDRESS),
                    state: 'initialized' as const,
                    tokenAmount: { amount: '1234560000', decimals: 6, uiAmount: 1234.56, uiAmountString: '1234.56' },
                },
                name: 'USD Coin',
                pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                symbol: 'USDC',
            },
        ],
    },
    status: FetchStatus.Fetched,
};

function MockTokensState({ children, value }: { children: React.ReactNode; value: TokensState }) {
    return (
        <ClusterProvider>
            <TokensStateCtx.Provider value={value}>
                <TokensDispatch.Provider value={noop as any}>{children}</TokensDispatch.Provider>
            </TokensStateCtx.Provider>
        </ClusterProvider>
    );
}

const WithTokens: Decorator = Story => (
    <MockTokensState value={tokensState({ [ADDRESS]: sampleTokensEntry as any })}>
        <Story />
    </MockTokensState>
);

const WithNoTokens: Decorator = Story => (
    <MockTokensState
        value={tokensState({
            [ADDRESS]: { data: { tokens: [] }, status: FetchStatus.Fetched },
        })}
    >
        <Story />
    </MockTokensState>
);

const meta = {
    component: OwnedTokensCard,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/OwnedTokensCard',
} satisfies Meta<typeof OwnedTokensCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHoldings: Story = {
    args: { address: ADDRESS },
    decorators: [WithTokens],
};

export const Empty: Story = {
    args: { address: ADDRESS },
    decorators: [WithNoTokens],
};
