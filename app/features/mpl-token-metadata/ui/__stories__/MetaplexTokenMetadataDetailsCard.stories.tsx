import { createInstructionParserDispatcher, type DispatchResult } from '@entities/instruction-parser';
import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
} from '@metaplex-foundation/mpl-token-metadata';
import { none, some } from '@metaplex-foundation/umi';
import type { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { instructionCardDecorators } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { invariant } from '@/app/shared/lib/invariant';

import { createMetadataAccountV3Data, KEYS, tokenMetadataInstruction } from '../../__fixtures__/instructions';
import { metaplexTokenMetadataInstructionParser } from '../../lib/metaplex-token-metadata-client';
import { MetaplexTokenMetadataDetailsCard } from '../MetaplexTokenMetadataDetailsCard';

const [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E] = KEYS;

const dispatcher = createInstructionParserDispatcher([metaplexTokenMetadataInstructionParser]);

function makeIx(
    data: Uint8Array | Buffer,
    keys: PublicKey[] = [],
): { ix: DispatchResult; raw: TransactionInstruction } {
    const raw = tokenMetadataInstruction(data, keys);
    const ix = dispatcher.fromTransactionInstruction(raw);
    invariant(ix, 'the token metadata program is registered');
    return { ix, raw };
}

const updateMetadataV2Serializer = getUpdateMetadataAccountV2InstructionDataSerializer();
const createMasterEditionV3Serializer = getCreateMasterEditionV3InstructionDataSerializer();

const meta = {
    component: MetaplexTokenMetadataDetailsCard,
    decorators: instructionCardDecorators,
    tags: ['autodocs', 'test'],
    title: 'Features/MplTokenMetadata/MetaplexTokenMetadataDetailsCard',
} satisfies Meta<typeof MetaplexTokenMetadataDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMetadataAccountV3: Story = {
    args: {
        index: 0,
        ...makeIx(createMetadataAccountV3Data(), [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E]),
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
        ...makeIx(
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
        ...makeIx(
            Buffer.from(
                createMasterEditionV3Serializer.serialize({
                    maxSupply: some(100n),
                }),
            ),
            [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_A],
        ),
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
        ...makeIx(new Uint8Array([7]), [KEY_A, KEY_B]),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
    },
};

export const UnknownInstruction: Story = {
    args: {
        index: 4,
        ...makeIx(new Uint8Array([0xff]), [KEY_A, KEY_B]),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Unknown Instruction')).toBeInTheDocument();
    },
};
