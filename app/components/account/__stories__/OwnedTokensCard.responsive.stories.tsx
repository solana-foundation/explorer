import {
    DispatchContext as TokensDispatch,
    type State as TokensState,
    StateContext as TokensStateCtx,
} from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { nextjsParameters, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import React from 'react';

import { OwnedTokensCard } from '../OwnedTokensCard';

const ADDRESS = '11111111111111111111111111111111';
const noop = () => undefined;

const tokensState = (entries: TokensState['entries']): TokensState => ({
    entries,
    url: 'https://api.mainnet-beta.solana.com',
});

const sampleEntry = {
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
                logoURI:
                    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                name: 'USD Coin',
                pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                symbol: 'USDC',
            },
        ],
    },
    status: FetchStatus.Fetched,
};

const withTokens: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <TokensStateCtx.Provider value={tokensState({ [ADDRESS]: sampleEntry as any })}>
                <TokensDispatch.Provider value={noop as any}>
                    <Story />
                </TokensDispatch.Provider>
            </TokensStateCtx.Provider>
        </MockAccountsProvider>
    </ClusterProvider>
);

const meta: Meta<typeof OwnedTokensCard> = {
    component: OwnedTokensCard,
    decorators: [withTokenInfoBatch, withTokens, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/OwnedTokensCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
