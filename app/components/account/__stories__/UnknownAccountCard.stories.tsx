import { gen } from '@__fixtures__/gen';
import { makeAccount } from '@entities/account/__fixtures__/account';
import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { UnknownAccountCard } from '../UnknownAccountCard';

const meta = {
    component: UnknownAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/UnknownAccountCard',
} satisfies Meta<typeof UnknownAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseAccount = makeAccount({ pubkey: gen.publicKey(1), space: 165 });

export const WithBalance: Story = {
    args: {
        account: baseAccount,
    },
};

export const ExecutableProgram: Story = {
    args: {
        account: { ...baseAccount, executable: true, pubkey: gen.publicKey(2), space: undefined },
    },
};

export const ZeroBalanceTriggersClusterLookup: Story = {
    args: {
        account: { ...baseAccount, lamports: 0, pubkey: gen.publicKey(3) },
    },
};
