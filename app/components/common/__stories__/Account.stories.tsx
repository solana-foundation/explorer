import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

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
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Common/Account',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Header: Story = {
    render: () => <div className="card"><AccountHeader title="Account Overview" analyticsSection="story" refresh={() => undefined} /></div>,
};

export const Rows: Story = {
    render: () => (
        <div className="card">
            <table className="table table-sm table-nowrap card-table">
                <tbody>
                    <AccountAddressRow account={sampleAccount} />
                    <AccountBalanceRow account={sampleAccount} />
                </tbody>
            </table>
        </div>
    ),
};
