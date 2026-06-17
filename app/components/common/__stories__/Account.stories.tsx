import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { BaseTable } from '@/app/shared/ui/Table';

import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '../Account';

const sampleAccount: Account = {
    data: {},
    executable: false,
    lamports: 4_200_000_000,
    owner: new PublicKey('11111111111111111111111111111111'),
    pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    space: 0,
};

const meta = {
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/Account',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Header: Story = {
    render: () => <AccountHeader title="Account Overview" analyticsSection="story" refresh={() => undefined} />,
};

export const Rows: Story = {
    render: () => (
        <BaseTable ui="dashkit" variant="card" nowrap>
            <BaseTable.Body>
                <AccountAddressRow account={sampleAccount} />
                <AccountBalanceRow account={sampleAccount} />
            </BaseTable.Body>
        </BaseTable>
    ),
};
