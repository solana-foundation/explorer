import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getCreateMetadataAccountV3InstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
} from '@metaplex-foundation/mpl-token-metadata';
import { none, some } from '@metaplex-foundation/umi';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withTransactions } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { TOKEN_METADATA_PROGRAM_ADDRESS } from '../../metaplex-token-metadata.parser';
import { MetaplexTokenMetadataDetailsCard } from '../MetaplexTokenMetadataDetailsCard';

const PROGRAM_ID = new PublicKey(TOKEN_METADATA_PROGRAM_ADDRESS);
const KEY_A = new PublicKey(new Uint8Array(32).fill(1));
const KEY_B = new PublicKey(new Uint8Array(32).fill(2));
const KEY_C = new PublicKey(new Uint8Array(32).fill(3));
const KEY_D = new PublicKey(new Uint8Array(32).fill(4));
const KEY_E = PublicKey.default;

function makeIx(data: Uint8Array | Buffer, keys: PublicKey[] = []): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: false, pubkey })),
        programId: PROGRAM_ID,
    });
}

const createMetadataV3Serializer = getCreateMetadataAccountV3InstructionDataSerializer();
const updateMetadataV2Serializer = getUpdateMetadataAccountV2InstructionDataSerializer();
const createMasterEditionV3Serializer = getCreateMasterEditionV3InstructionDataSerializer();

const meta = {
    component: MetaplexTokenMetadataDetailsCard,
    decorators: [withTransactions],
    parameters: {
        ...nextjsParameters,
        layout: 'padded',
    },
    tags: ['autodocs', 'test'],
    title: 'Features/MplTokenMetadata/MetaplexTokenMetadataDetailsCard',
} satisfies Meta<typeof MetaplexTokenMetadataDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMetadataAccountV3: Story = {
    args: {
        index: 0,
        ix: makeIx(
            Buffer.from(
                createMetadataV3Serializer.serialize({
                    collectionDetails: none(),
                    data: {
                        collection: none(),
                        creators: none(),
                        name: 'My NFT',
                        sellerFeeBasisPoints: 500,
                        symbol: 'MNFT',
                        uri: 'https://example.com/nft.json',
                        uses: none(),
                    },
                    isMutable: true,
                }),
            ),
            [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E],
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Create Metadata Account V3')).toBeInTheDocument();
        await expect(canvas.getByText('My NFT')).toBeInTheDocument();
        await expect(canvas.getByText('MNFT')).toBeInTheDocument();
        await expect(canvas.getByText('5%')).toBeInTheDocument();
    },
};

export const UpdateMetadataAccountV2: Story = {
    args: {
        index: 1,
        ix: makeIx(
            Buffer.from(
                updateMetadataV2Serializer.serialize({
                    data: some({
                        collection: none(),
                        creators: none(),
                        name: 'Updated NFT',
                        sellerFeeBasisPoints: 0,
                        symbol: 'UNFT',
                        uri: 'https://example.com/updated.json',
                        uses: none(),
                    }),
                    isMutable: some(true),
                    newUpdateAuthority: none(),
                    primarySaleHappened: some(false),
                }),
            ),
            [KEY_A, KEY_B],
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Update Metadata Account V2')).toBeInTheDocument();
        await expect(canvas.getByText('Updated NFT')).toBeInTheDocument();
    },
};

export const CreateMasterEditionV3: Story = {
    args: {
        index: 2,
        ix: makeIx(
            Buffer.from(
                createMasterEditionV3Serializer.serialize({
                    maxSupply: some(100n),
                }),
            ),
            [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_A],
        ),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Create Master Edition V3')).toBeInTheDocument();
        await expect(canvas.getByText('100')).toBeInTheDocument();
    },
};

export const SignMetadata: Story = {
    args: {
        index: 3,
        // discriminator byte 7 = signMetadata
        ix: makeIx(new Uint8Array([7]), [KEY_A, KEY_B]),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
    },
};

export const UnknownInstruction: Story = {
    args: {
        index: 4,
        ix: makeIx(new Uint8Array([0xff])),
        result: { err: null },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Unknown Instruction')).toBeInTheDocument();
    },
};

export const FailedTransaction: Story = {
    args: {
        index: 5,
        ix: makeIx(new Uint8Array([7]), [KEY_A, KEY_B]),
        result: { err: 'InstructionError' },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
    },
};
