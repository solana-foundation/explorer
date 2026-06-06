import {
    DispatchContext as TokensDispatch,
    type State as TokensState,
    StateContext as TokensStateCtx,
} from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import {
    DispatchContext as ParsedDetailsDispatch,
    StateContext as ParsedDetailsStateCtx,
} from '@providers/transactions/parsed';
import { PublicKey } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { nextjsParameters, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import React from 'react';

import { TokenHistoryCard } from '../TokenHistoryCard';

const ADDRESS = PublicKey.default.toBase58();
const MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com';
const noop = () => undefined;

type ParsedDetailsState = React.ContextType<typeof ParsedDetailsStateCtx>;

const tokensStateValue: TokensState = {
    entries: {
        [ADDRESS]: {
            data: {
                tokens: [
                    {
                        info: {
                            isNative: false,
                            mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                            owner: PublicKey.default,
                            state: 'initialized',
                            tokenAmount: { amount: '0', decimals: 6, uiAmountString: '0' },
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
    url: MAINNET_RPC_URL,
};

const emptyParsedDetailsState: ParsedDetailsState = { entries: {}, url: MAINNET_RPC_URL };

const withToken: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <TokensStateCtx.Provider value={tokensStateValue}>
                <TokensDispatch.Provider value={noop}>
                    <MockHistoryProvider>
                        <ParsedDetailsStateCtx.Provider value={emptyParsedDetailsState}>
                            <ParsedDetailsDispatch.Provider value={noop}>
                                <Story />
                            </ParsedDetailsDispatch.Provider>
                        </ParsedDetailsStateCtx.Provider>
                    </MockHistoryProvider>
                </TokensDispatch.Provider>
            </TokensStateCtx.Provider>
        </MockAccountsProvider>
    </ClusterProvider>
);

const meta: Meta<typeof TokenHistoryCard> = {
    component: TokenHistoryCard,
    decorators: [withTokenInfoBatch, withToken, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/TokenHistoryCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
