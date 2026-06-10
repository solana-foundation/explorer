import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';

import { UnknownAccountCard } from '../UnknownAccountCard';

const meta = {
    component: UnknownAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/UnknownAccountCard',
} satisfies Meta<typeof UnknownAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseAccount = {
    data: {},
    executable: false,
    lamports: 1_000_000_000,
    owner: PublicKey.default,
    pubkey: PublicKey.unique(),
    space: 165,
};

export const WithBalance: Story = {
    args: {
        account: baseAccount,
    },
};

export const ExecutableProgram: Story = {
    args: {
        account: { ...baseAccount, executable: true, pubkey: PublicKey.unique(), space: undefined },
    },
};

export const ZeroBalanceTriggersClusterLookup: Story = {
    args: {
        account: { ...baseAccount, lamports: 0, pubkey: PublicKey.unique() },
    },
};
