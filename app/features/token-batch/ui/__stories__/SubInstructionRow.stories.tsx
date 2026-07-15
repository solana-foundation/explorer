import { PublicKey } from '@solana/web3.js';
import { withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { SubInstructionRowView } from '../SubInstructionRow';

const meta = {
    component: SubInstructionRowView,
    decorators: [withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Features/TokenBatch/SubInstructionRow',
} satisfies Meta<typeof SubInstructionRowView>;

export default meta;
type Story = StoryObj<typeof meta>;

const SOURCE = new PublicKey('So11111111111111111111111111111111111111112');
const DEST = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const AUTHORITY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Transfer: amount field only, no accounts listed
export const Transfer: Story = {
    args: {
        decoded: {
            accounts: [],
            fields: [{ isAddress: false, label: 'Amount', value: '1000000' }],
        },
        index: 0,
        typeName: 'Transfer',
    },
};

// TransferChecked: amount + decimals fields
export const TransferChecked: Story = {
    args: {
        decoded: {
            accounts: [],
            fields: [
                { isAddress: false, label: 'Amount', value: '5000000' },
                { isAddress: false, label: 'Decimals', value: '6' },
            ],
        },
        index: 1,
        typeName: 'TransferChecked',
    },
};

// SetAuthority: field with an address value
export const SetAuthority: Story = {
    args: {
        decoded: {
            accounts: [],
            fields: [
                { isAddress: false, label: 'Authority Type', value: 'MintTokens' },
                { isAddress: true, label: 'New Authority', value: AUTHORITY.toBase58() },
            ],
        },
        index: 2,
        typeName: 'SetAuthority',
    },
};

// WithAccounts: labeled accounts with writable / signer badges
export const WithAccounts: Story = {
    args: {
        decoded: {
            accounts: [
                { isSigner: false, isWritable: true, label: 'Source', pubkey: SOURCE },
                { isSigner: false, isWritable: true, label: 'Destination', pubkey: DEST },
                { isSigner: true, isWritable: false, label: 'Authority', pubkey: AUTHORITY },
            ],
            fields: [{ isAddress: false, label: 'Amount', value: '7500' }],
        },
        index: 3,
        typeName: 'Transfer',
    },
};

// NoDecoded: hook hasn't resolved yet or instruction unknown
export const NoDecoded: Story = {
    args: {
        decoded: undefined,
        index: 4,
        typeName: 'SyncNative',
    },
};
