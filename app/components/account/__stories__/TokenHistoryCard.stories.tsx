import {
    DispatchContext as TokensDispatch,
    StateContext as TokensStateCtx,
} from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { ClusterProvider } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';
import React from 'react';

import { TokenHistoryCard } from '../TokenHistoryCard';

const ADDRESS = '11111111111111111111111111111111';
const noop = () => undefined;

// Single owned token; history will start empty so the card renders the empty/no-history state.
const tokensStateValue = {
    entries: {
        [ADDRESS]: {
            data: {
                tokens: [
                    {
                        info: {
                            isNative: false,
                            mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                            owner: new PublicKey(ADDRESS),
                            state: 'initialized' as const,
                            tokenAmount: { amount: '0', decimals: 6, uiAmount: 0, uiAmountString: '0' },
                        },
                        name: 'USD Coin',
                        pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                        symbol: 'USDC',
                    },
                ],
            },
            status: FetchStatus.Fetched,
        },
    },
    url: 'https://api.mainnet-beta.solana.com',
};

const WithToken: Decorator = Story => (
    <ClusterProvider>
        <TokensStateCtx.Provider value={tokensStateValue as any}>
            <TokensDispatch.Provider value={noop as any}>
                <Story />
            </TokensDispatch.Provider>
        </TokensStateCtx.Provider>
    </ClusterProvider>
);

const meta = {
    component: TokenHistoryCard,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/TokenHistoryCard',
} satisfies Meta<typeof TokenHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Token present but no history seeded → renders the initial "Click to load token history" card.
export const InitialLoadPrompt: Story = {
    args: { address: ADDRESS },
    decorators: [WithToken],
};
