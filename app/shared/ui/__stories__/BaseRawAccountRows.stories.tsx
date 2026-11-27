import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { BaseRawAccountRows } from '@/app/shared/ui/BaseRawAccountRows';

const mockAccount: Account = {
    data: {},
    executable: false,
    lamports: 1_500_000_000,
    owner: gen.publicKey(0),
    pubkey: gen.publicKey(1),
    space: 165,
};

const mockRawData = new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13,
    0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
]);

const meta: Meta<typeof BaseRawAccountRows> = {
    component: BaseRawAccountRows,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Shared/BaseRawAccountRows',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        account: mockAccount,
        isLoading: false,
        rawData: mockRawData,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Balance (SOL)')).toBeVisible();
        await expect(canvas.getByText('Allocated Data Size')).toBeVisible();
        await expect(canvas.getByText('165 byte(s)')).toBeVisible();
    },
};

export const Loading: Story = {
    args: {
        account: mockAccount,
        isLoading: true,
        rawData: undefined,
    },
};

export const NotFound: Story = {
    args: {
        account: mockAccount,
        isLoading: false,
        rawData: undefined,
    },
};

export const EmptyData: Story = {
    args: {
        account: { ...mockAccount, space: 0 },
        isLoading: false,
        rawData: new Uint8Array(0),
    },
};

export const Executable: Story = {
    args: {
        account: { ...mockAccount, executable: true, space: 36 },
        isLoading: false,
        rawData: mockRawData,
    },
};
