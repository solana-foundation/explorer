import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { BaseAccountCard } from '../BaseAccountCard';
import { BaseRawAccountRows } from '../BaseRawAccountRows';

const mockAccount: Account = {
    data: {},
    executable: false,
    lamports: 1_500_000_000,
    owner: new PublicKey('11111111111111111111111111111111'),
    pubkey: new PublicKey('4TPTXRKCbL39nMkWAtRDMRB4gQkUfrfCMvwKS4AYoH7e'),
    space: 165,
};

const mockRawData = new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13,
    0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
]);

const meta: Meta<typeof BaseAccountCard> = {
    component: BaseAccountCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    title: 'Features/Account/BaseAccountCard',
};

export default meta;
type Story = StoryObj<typeof BaseAccountCard>;

/** Default card showing parsed rows as children. */
export const Default: Story = {
    args: {
        title: 'Token Account',
    },
    render: args => (
        <BaseAccountCard {...args}>
            <tr>
                <td>Token Balance</td>
                <td className="text-lg-end">1,000.00</td>
            </tr>
            <tr>
                <td>Mint</td>
                <td className="text-lg-end">So11...1112</td>
            </tr>
        </BaseAccountCard>
    ),
};

/** Card with a refresh button. */
export const WithRefresh: Story = {
    args: {
        refresh: () => {},
        title: 'Unknown Account',
    },
    render: args => (
        <BaseAccountCard {...args}>
            <tr>
                <td>Owner</td>
                <td className="text-lg-end">System Program</td>
            </tr>
        </BaseAccountCard>
    ),
};

/** Card without the Raw toggle button. */
export const WithoutRawButton: Story = {
    args: {
        showRawButton: false,
        title: 'Nonce Account',
    },
    render: args => (
        <BaseAccountCard {...args}>
            <tr>
                <td>Authority</td>
                <td className="text-lg-end">4TPT...oH7e</td>
            </tr>
        </BaseAccountCard>
    ),
};

/** Card with rawContent provided — clicking Raw toggles to BaseRawAccountRows. */
export const WithRawContent: Story = {
    args: {
        rawContent: <BaseRawAccountRows account={mockAccount} rawData={mockRawData} isLoading={false} />,
        title: 'Token Account',
    },
    render: args => (
        <BaseAccountCard {...args}>
            <tr>
                <td>Token Balance</td>
                <td className="text-lg-end">1,000.00</td>
            </tr>
        </BaseAccountCard>
    ),
};
