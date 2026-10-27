import { toRawInstructionNode } from '@entities/instruction-card';
import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withTokenInfoBatch,
    withTransactions,
    withTxInstructionSurface,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { concatBytes, toBuffer, writeU64LE } from '@/app/shared/lib/bytes';

import { makeAccount, makeBatchIx, makeBatchIxWithKeys, makeSetAuthorityData } from '../../lib/__tests__/test-utils';
import { BATCH_DISCRIMINATOR } from '../../lib/const';
import { TokenBatchCard } from '../TokenBatchCard';

const meta = {
    component: TokenBatchCard,
    decorators: [withTransactions, withTokenInfoBatch, withTxInstructionSurface],
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/TokenBatch/TokenBatchCard',
} satisfies Meta<typeof TokenBatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Transfer (disc 3) + Burn (disc 8) batched together
const transferData = concatBytes(new Uint8Array([3]), writeU64LE(1_000_000n));
const burnData = concatBytes(new Uint8Array([8]), writeU64LE(500n));

export const TwoSubInstructions: Story = {
    args: batchArgs(
        makeBatchIx(
            [
                { data: transferData, numAccounts: 3 },
                { data: burnData, numAccounts: 3 },
            ],
            6,
        ),
        0,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (2 instructions)', { exact: false })).toBeInTheDocument();
        await expect(canvas.getByText('#1 Transfer')).toBeInTheDocument();
        await expect(canvas.getByText('#2 Burn')).toBeInTheDocument();
    },
};

// Single TransferChecked (disc 12) — verifies singular title, decoded amount and decimals
const transferCheckedData = concatBytes(new Uint8Array([12]), writeU64LE(5_000_000n), new Uint8Array([6]));

export const SingleSubInstruction: Story = {
    args: batchArgs(makeBatchIx([{ data: transferCheckedData, numAccounts: 4 }], 4), 1),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (1 instruction)', { exact: false })).toBeInTheDocument();
        await expect(canvas.getByText('#1 TransferChecked')).toBeInTheDocument();
        await expect(canvas.getByText('5')).toBeInTheDocument();
        await expect(canvas.getByText('Decimals')).toBeInTheDocument();
        await expect(canvas.getByText('6')).toBeInTheDocument();
    },
};

// Transfer with a specific amount — verifies decoded Amount field
export const DecodedTransferAmount: Story = {
    args: batchArgs(
        makeBatchIx([{ data: concatBytes(new Uint8Array([3]), writeU64LE(42000n)), numAccounts: 3 }], 3),
        5,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('42000')).toBeInTheDocument();
        await expect(canvas.getByText('Amount')).toBeInTheDocument();
    },
};

// Unknown discriminator — SDK cannot parse it, shows as parse error
export const UnknownDiscriminator: Story = {
    args: batchArgs(makeBatchIx([{ data: new Uint8Array([0xfe, 0xab, 0xcd]), numAccounts: 2 }], 2), 2),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Parse Error')).toBeInTheDocument();
    },
};

// Truncated data triggers parse error
export const ParseError: Story = {
    args: batchArgs(
        new TransactionInstruction({
            data: toBuffer(new Uint8Array([BATCH_DISCRIMINATOR, 5])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        3,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Parse Error')).toBeInTheDocument();
    },
};

// Empty batch (just the discriminator, no sub-instructions)
export const EmptyBatch: Story = {
    args: batchArgs(
        new TransactionInstruction({
            data: toBuffer(new Uint8Array([BATCH_DISCRIMINATOR])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        4,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (0 instructions)', { exact: false })).toBeInTheDocument();
        await expect(canvas.queryByText('#1 ', { exact: false })).not.toBeInTheDocument();
    },
};

// SetAuthority with a new authority pubkey — fixed literal so captures are deterministic
const newAuthority = new PublicKey('UM1jjYaM2Y4BDSdCw3AiELrP6HDpz62VjUHcHVJosix');

export const SetAuthorityWithNewAuthority: Story = {
    args: batchArgs(
        makeBatchIxWithKeys(
            [{ data: makeSetAuthorityData(0, newAuthority), numAccounts: 2 }],
            [makeAccount(true, false), makeAccount(false, true)],
        ),
        7,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('#1 SetAuthority')).toBeInTheDocument();
        await expect(canvas.getByText('Authority Type')).toBeInTheDocument();
        await expect(canvas.getByText('MintTokens')).toBeInTheDocument();
        await expect(canvas.getByText('New Authority')).toBeInTheDocument();
        await expect(canvasElement.querySelector(`[data-address="${newAuthority.toBase58()}"]`)).toBeTruthy();
    },
};

// SetAuthority revoking authority (no new authority)
export const SetAuthorityRevoke: Story = {
    args: batchArgs(makeBatchIx([{ data: makeSetAuthorityData(3), numAccounts: 2 }], 2), 8),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('#1 SetAuthority')).toBeInTheDocument();
        // Scope to the Authority Type field row to avoid false positives if a
        // CloseAccount sub-instruction heading is ever added to this story.
        const authorityTypeRow = canvas.getByText('Authority Type').closest('tr');
        if (!authorityTypeRow) throw new Error('Expected Authority Type row');
        await expect(within(authorityTypeRow).getByText('CloseAccount')).toBeInTheDocument();
        await expect(canvas.getByText('(none)')).toBeInTheDocument();
    },
};

// Multisig Transfer — authority is a multisig address followed by 2 co-signers
export const MultisigCoSigners: Story = {
    args: batchArgs(
        makeBatchIxWithKeys(
            [{ data: concatBytes(new Uint8Array([3]), writeU64LE(7500n)), numAccounts: 5 }],
            [
                makeAccount(true, false), // Source (writable)
                makeAccount(true, false), // Destination (writable)
                makeAccount(false, false), // Multisig authority (not a signer itself)
                makeAccount(false, true), // Co-signer 1
                makeAccount(false, true), // Co-signer 2
            ],
        ),
        9,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('#1 Transfer')).toBeInTheDocument();
        await expect(canvas.getByText('Amount')).toBeInTheDocument();
        await expect(canvas.getByText('7500')).toBeInTheDocument();
        await expect(canvas.getByText('Signer 1')).toBeInTheDocument();
        await expect(canvas.getByText('Signer 2')).toBeInTheDocument();
    },
};

// SyncNative (disc 17) — not in formatByType, exercises the generic fallback
// that extracts accounts from the parsed instruction.
export const UnhandledInstructionType: Story = {
    args: batchArgs(
        makeBatchIxWithKeys([{ data: new Uint8Array([17]), numAccounts: 1 }], [makeAccount(true, false)]),
        10,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('#1 SyncNative')).toBeInTheDocument();
        // Generic fallback should render the account address
        await expect(canvas.getByText('Account')).toBeInTheDocument();
    },
};

// Writable and signer badges rendered on accounts
export const WritableAndSignerBadges: Story = {
    args: batchArgs(
        makeBatchIxWithKeys(
            [{ data: concatBytes(new Uint8Array([3]), writeU64LE(100n)), numAccounts: 3 }],
            [
                makeAccount(true, false), // writable, not signer
                makeAccount(true, false), // writable, not signer
                makeAccount(false, true), // not writable, signer
            ],
        ),
        6,
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const writableBadges = canvas.getAllByText('Writable');
        await expect(writableBadges.length).toBe(2);
        await expect(canvas.getByText('Signer')).toBeInTheDocument();
    },
};

function batchArgs(ix: TransactionInstruction, index: number) {
    return { node: toRawInstructionNode({ index, ix }) };
}
