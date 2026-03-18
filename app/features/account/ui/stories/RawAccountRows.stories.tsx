import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';

import { nextjsParameters, withCardTableField, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { BaseRawAccountRows } from '../AccountCardBase';

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

const meta: Meta<typeof BaseRawAccountRows> = {
    component: BaseRawAccountRows,
    decorators: [withCardTableField, withTokenInfoBatch],
    parameters: nextjsParameters,
    title: 'Features/Account/BaseRawAccountRows',
};

export default meta;
type Story = StoryObj<typeof BaseRawAccountRows>;

/** Raw data loaded and displayed as hex. */
export const WithData: Story = {
    args: {
        account: mockAccount,
        rawData: mockRawData,
    },
};

/** Loading state before raw data arrives. */
export const Loading: Story = {
    args: {
        account: mockAccount,
        rawData: null,
    },
};

/** Account with zero data bytes. */
export const EmptyData: Story = {
    args: {
        account: { ...mockAccount, space: 0 },
        rawData: new Uint8Array(0),
    },
};

/** Executable program account. */
export const Executable: Story = {
    args: {
        account: { ...mockAccount, executable: true, space: 36 },
        rawData: mockRawData,
    },
};
