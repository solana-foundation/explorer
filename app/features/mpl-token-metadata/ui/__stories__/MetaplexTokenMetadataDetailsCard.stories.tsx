import { type InstructionNode, toInstructionNode } from '@entities/instruction-card';
import {
    createInstructionParserDispatcher,
    isParsedInstruction,
    type ParsedInstructionInfo,
} from '@entities/instruction-parser';
import {
    getCreateMasterEditionV3InstructionDataSerializer,
    getUpdateMetadataAccountV2InstructionDataSerializer,
} from '@metaplex-foundation/mpl-token-metadata';
import { none, some } from '@metaplex-foundation/umi';
import type { PublicKey } from '@solana/web3.js';
import { withTokenInfoBatch, withTransactions, withTxInstructionSurface } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { invariant } from '@/app/shared/lib/invariant';

import { createMetadataAccountV3Data, KEYS, tokenMetadataInstruction } from '../../__fixtures__/instructions';
import { metaplexTokenMetadataInstructionParser } from '../../lib/metaplex-token-metadata-client';
import { MetaplexTokenMetadataDetailsCard } from '../MetaplexTokenMetadataDetailsCard';

const [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E] = KEYS;

const dispatcher = createInstructionParserDispatcher([metaplexTokenMetadataInstructionParser]);

function makeIx(
    index: number,
    data: Uint8Array | Buffer,
    keys: PublicKey[] = [],
): { node: InstructionNode; parsed: ParsedInstructionInfo | undefined } {
    const raw = tokenMetadataInstruction(data, keys);
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    invariant(dispatched, 'the token metadata program is registered');
    return {
        node: toInstructionNode({ index, ix: raw }),
        parsed: isParsedInstruction(dispatched) ? dispatched.parsed : undefined,
    };
}

const updateMetadataV2Serializer = getUpdateMetadataAccountV2InstructionDataSerializer();
const createMasterEditionV3Serializer = getCreateMasterEditionV3InstructionDataSerializer();

const meta = {
    component: MetaplexTokenMetadataDetailsCard,
    decorators: [withTxInstructionSurface, withTransactions, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Features/MplTokenMetadata/MetaplexTokenMetadataDetailsCard',
} satisfies Meta<typeof MetaplexTokenMetadataDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMetadataAccountV3: Story = {
    args: makeIx(0, createMetadataAccountV3Data(), [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E]),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Create Metadata Account V3')).toBeInTheDocument();
        await expect(canvas.getByText('My NFT')).toBeInTheDocument();
        await expect(canvas.getByText('MNFT')).toBeInTheDocument();
        await expect(canvas.getByText('5%')).toBeInTheDocument();
    },
};

export const UpdateMetadataAccountV2: Story = {
    args: makeIx(
        1,
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Update Metadata Account V2')).toBeInTheDocument();
        await expect(canvas.getByText('Updated NFT')).toBeInTheDocument();
    },
};

export const CreateMasterEditionV3: Story = {
    args: makeIx(
        2,
        Buffer.from(
            createMasterEditionV3Serializer.serialize({
                maxSupply: some(100n),
            }),
        ),
        [KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_A],
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Create Master Edition V3')).toBeInTheDocument();
        await expect(canvas.getByText('100')).toBeInTheDocument();
    },
};

export const SignMetadata: Story = {
    args: makeIx(
        3,
        // discriminator byte 7 = signMetadata
        new Uint8Array([7]),
        [KEY_A, KEY_B],
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
    },
};

export const UnknownInstruction: Story = {
    args: makeIx(4, new Uint8Array([0xff]), [KEY_A, KEY_B]),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Token Metadata Program: Unknown Instruction')).toBeInTheDocument();
    },
};
