import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import { AccountDiscriminator, getPlanEncoder, PlanStatus, SUBSCRIPTIONS_PROGRAM_ADDRESS } from '@solana/subscriptions';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withMockRpc, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';

const ZERO = address('11111111111111111111111111111111');
const PROGRAM_OWNER = toLegacyPublicKey(address(SUBSCRIPTIONS_PROGRAM_ADDRESS));
const ACCOUNT_ADDRESS = gen.publicKey(0);
const USER = address(gen.address(1));
const MINT = address(gen.address(2));

function encode<T>(encoder: { encode: (v: T) => unknown }, value: T): Uint8Array {
    return encoder.encode(value) as unknown as Uint8Array;
}

const PLAN_BYTES = encode(getPlanEncoder(), {
    bump: 255,
    data: {
        destinations: [ZERO, ZERO, ZERO, ZERO],
        endTs: 0n,
        metadataUri: 'https://example.com/plan.json',
        mint: MINT,
        planId: 42n,
        pullers: [ZERO, ZERO, ZERO, ZERO],
        terms: { amount: 1_000_000n, createdAt: 0n, periodHours: 24n },
    },
    discriminator: AccountDiscriminator.Plan,
    owner: USER,
    status: PlanStatus.Active,
});

const account: Account = {
    data: { raw: PLAN_BYTES },
    executable: false,
    lamports: 1_000_000,
    owner: PROGRAM_OWNER,
    pubkey: ACCOUNT_ADDRESS,
    space: PLAN_BYTES.length,
};

const onNotFound = () => {
    throw new Error('onNotFound called unexpectedly');
};

const args = { account, onNotFound };

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: SubscriptionsAccountCard,
    decorators: [withMockRpc, withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Subscriptions/SubscriptionsAccountCard@Media',
} satisfies Meta<typeof SubscriptionsAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

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
