import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withTokenInfoBatch, withTransactions } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { toBuffer } from '@/app/shared/lib/bytes';

import { makeAccount, makeBatchIx, makeBatchIxWithKeys, makeSetAuthorityData } from '../../lib/__tests__/test-utils';
import { concatBytes, writeU64LE } from '../../lib/bytes';
import { BATCH_DISCRIMINATOR } from '../../lib/const';
import { TokenBatchCard } from '../TokenBatchCard';

const meta = {
    component: TokenBatchCard,
    decorators: [withTransactions, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        layout: 'padded',
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
    args: {
        index: 0,
        ix: makeBatchIx(
            [
                { data: transferData, numAccounts: 3 },
                { data: burnData, numAccounts: 3 },
            ],
            6,
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (2 instructions)', { exact: false })).toBeInTheDocument();
        await expect(canvas.getByText('Transfer')).toBeInTheDocument();
        await expect(canvas.getByText('Burn')).toBeInTheDocument();
        await expect(canvas.getByTestId('sub-ix-0')).toBeInTheDocument();
        await expect(canvas.getByTestId('sub-ix-1')).toBeInTheDocument();
    },
};

// Single TransferChecked (disc 12) — verifies singular title, decoded amount and decimals
const transferCheckedData = concatBytes(new Uint8Array([12]), writeU64LE(5_000_000n), new Uint8Array([6]));

export const SingleSubInstruction: Story = {
    args: {
        index: 1,
        ix: makeBatchIx([{ data: transferCheckedData, numAccounts: 4 }], 4),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (1 instruction)', { exact: false })).toBeInTheDocument();
        await expect(canvas.getByText('TransferChecked')).toBeInTheDocument();
        await expect(canvas.getByText('5000000')).toBeInTheDocument();
        await expect(canvas.getByText('Decimals:')).toBeInTheDocument();
        await expect(canvas.getByText('6')).toBeInTheDocument();
    },
};

// Transfer with a specific amount — verifies decoded Amount field
export const DecodedTransferAmount: Story = {
    args: {
        index: 5,
        ix: makeBatchIx([{ data: concatBytes(new Uint8Array([3]), writeU64LE(42000n)), numAccounts: 3 }], 3),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('42000')).toBeInTheDocument();
        await expect(canvas.getByText('Amount:')).toBeInTheDocument();
    },
};

// Unknown discriminator renders raw hex data
export const UnknownDiscriminator: Story = {
    args: {
        index: 2,
        ix: makeBatchIx([{ data: new Uint8Array([0xfe, 0xab, 0xcd]), numAccounts: 2 }], 2),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Unknown')).toBeInTheDocument();
        await expect(canvas.getByText('feabcd')).toBeInTheDocument();
    },
};

// Truncated data triggers parse error
export const ParseError: Story = {
    args: {
        index: 3,
        ix: new TransactionInstruction({
            data: toBuffer(new Uint8Array([BATCH_DISCRIMINATOR, 5])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('batch-error')).toBeInTheDocument();
    },
};

// Empty batch (just the discriminator, no sub-instructions)
export const EmptyBatch: Story = {
    args: {
        index: 4,
        ix: new TransactionInstruction({
            data: toBuffer(new Uint8Array([BATCH_DISCRIMINATOR])),
            keys: [],
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Batch (0 instructions)', { exact: false })).toBeInTheDocument();
        await expect(canvas.getByTestId('batch-empty')).toBeInTheDocument();
    },
};

// SetAuthority with a new authority pubkey
const newAuthority = Keypair.generate().publicKey;

export const SetAuthorityWithNewAuthority: Story = {
    args: {
        index: 7,
        ix: makeBatchIxWithKeys(
            [{ data: makeSetAuthorityData(0, newAuthority), numAccounts: 2 }],
            [makeAccount(true, false), makeAccount(false, true)],
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('SetAuthority')).toBeInTheDocument();
        await expect(canvas.getByText('Authority Type:')).toBeInTheDocument();
        await expect(canvas.getByText('MintTokens')).toBeInTheDocument();
        await expect(canvas.getByText('New Authority:')).toBeInTheDocument();
        await expect(canvas.getByText(newAuthority.toBase58())).toBeInTheDocument();
    },
};

// SetAuthority revoking authority (no new authority)
export const SetAuthorityRevoke: Story = {
    args: {
        index: 8,
        ix: makeBatchIx([{ data: makeSetAuthorityData(3), numAccounts: 2 }], 2),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('SetAuthority')).toBeInTheDocument();
        // Scope to the Authority Type field row to avoid false positives if a
        // CloseAccount sub-instruction badge is ever added to this story.
        const authorityTypeRow = canvas.getByText('Authority Type:').closest('div');
        if (!authorityTypeRow) throw new Error('Expected Authority Type row');
        await expect(within(authorityTypeRow).getByText('CloseAccount')).toBeInTheDocument();
        await expect(canvas.getByText('(none)')).toBeInTheDocument();
    },
};

// Writable and signer badges rendered on accounts
export const WritableAndSignerBadges: Story = {
    args: {
        index: 6,
        ix: makeBatchIxWithKeys(
            [{ data: concatBytes(new Uint8Array([3]), writeU64LE(100n)), numAccounts: 3 }],
            [
                makeAccount(true, false), // writable, not signer
                makeAccount(true, false), // writable, not signer
                makeAccount(false, true), // not writable, signer
            ],
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const writableBadges = canvas.getAllByText('Writable');
        await expect(writableBadges.length).toBe(2);
        await expect(canvas.getByText('Signer')).toBeInTheDocument();
    },
};
