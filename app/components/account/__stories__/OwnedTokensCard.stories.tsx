import { gen } from '@__fixtures__/gen';
import {
    ownedToken,
    ownedTokensEntry,
    OWNER,
    USDC_HOLDING,
    USDC_MINT,
    USDC_TOKEN_INFO,
} from '@components/account/__fixtures__/owned-tokens';
import { ChainId } from '@entities/chain-id';
import { getTokenInfosSwrKey } from '@entities/token-info/client';
import {
    DispatchContext as TokensDispatch,
    type State as TokensState,
    StateContext as TokensStateCtx,
} from '@providers/accounts/tokens';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { withTokenInfoBatch } from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';
import React from 'react';
import { expect, within } from 'storybook/test';
import { SWRConfig, unstable_serialize } from 'swr';

import { OwnedTokensCard } from '../OwnedTokensCard';

const noop = () => undefined;

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

// The card resolves every held mint in one lookup, so seed that lookup's cache entry rather than the
// per-mint batch provider. No entry for WSOL: an unresolved mint draws the fallback logo and, having
// no verified flag, sorts below the seeded row.
const seededTokenInfos = {
    [unstable_serialize(getTokenInfosSwrKey([USDC_MINT, WSOL_MINT], ChainId.MAINNET))]: new Map([
        [USDC_MINT, USDC_TOKEN_INFO],
    ]),
};

const tokensState = (entries: TokensState['entries']): TokensState => ({
    entries,
    url: 'https://api.mainnet-beta.solana.com',
});

const sampleTokensEntry = ownedTokensEntry([USDC_HOLDING]);

const sampleTokensWithLogosEntry = ownedTokensEntry([
    USDC_HOLDING,
    // No seeded logo for this mint exercises the fallback-logo branch alongside the seeded USDC row.
    ownedToken({ amount: '5000000000', decimals: 9, uiAmountString: '5' }, gen.address(2), WSOL_MINT),
]);

function MockTokensState({ children, value }: { children: React.ReactNode; value: TokensState }) {
    return (
        <ClusterProvider>
            <MockAccountsProvider>
                <TokensStateCtx.Provider value={value}>
                    <TokensDispatch.Provider value={noop as any}>{children}</TokensDispatch.Provider>
                </TokensStateCtx.Provider>
            </MockAccountsProvider>
        </ClusterProvider>
    );
}

const withTokens: Decorator = Story => (
    <MockTokensState value={tokensState({ [OWNER]: sampleTokensEntry })}>
        <Story />
    </MockTokensState>
);

const withTokensAndLogos: Decorator = Story => (
    <MockTokensState value={tokensState({ [OWNER]: sampleTokensWithLogosEntry })}>
        <Story />
    </MockTokensState>
);

const withNoTokens: Decorator = Story => (
    <MockTokensState value={tokensState({ [OWNER]: ownedTokensEntry([]) })}>
        <Story />
    </MockTokensState>
);

const meta = {
    component: OwnedTokensCard,
    decorators: [withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/OwnedTokensCard',
} satisfies Meta<typeof OwnedTokensCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHoldings: Story = {
    args: { address: OWNER },
    decorators: [withTokens],
};

export const WithLogos: Story = {
    args: { address: OWNER },
    decorators: [
        // Its own cache, and no revalidation: a fallback is only read when nothing is cached, and it
        // does not stop SWR refetching. There is no route to answer that fetch here, so without both
        // the seeded entry loses to an empty one.
        Story => (
            <SWRConfig value={{ fallback: seededTokenInfos, provider: () => new Map(), revalidateOnMount: false }}>
                <Story />
            </SWRConfig>
        ),
        withTokensAndLogos,
    ],
    // Symbol and logo can only come from resolved metadata, so this fails if the seeded entry stops
    // matching the key the card looks up.
    play: async ({ canvasElement }) => {
        await expect(await within(canvasElement).findByText('1234.56 USDC')).toBeInTheDocument();
        await expect(canvasElement.querySelector('img')).toHaveAttribute('src', USDC_TOKEN_INFO.logoURI);
    },
};

export const Empty: Story = {
    args: { address: OWNER },
    decorators: [withNoTokens],
};
