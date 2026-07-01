import { gen } from '@__fixtures__/gen';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import React from 'react';

import { SignatureContext } from '@/app/components/instruction/SignatureContext';
import anchor030Devi from '@/app/entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import { decodeAnchorInstruction } from '../../lib/decode-anchor-instruction';
import { AnchorDetailsCard } from '../AnchorDetailsCard';

// Construct a real Anchor Program instance from the bundled amm_v3 IDL fixture; the AccountInfo
// fetches inside the card no-op because the storybook accounts fetcher is a noop, but the BorshInstructionCoder
// can decode synthetic instruction data built from the IDL discriminators below.
const url = 'https://api.devnet.solana.com';
const noopWallet = {
    publicKey: PublicKey.default,
    signAllTransactions: async <T,>(txs: T[]) => txs,
    signTransaction: async <T,>(tx: T) => tx,
};
const mockProvider = {
    connection: { commitment: 'confirmed', rpcEndpoint: url },
    opts: { preflightCommitment: 'confirmed' },
    wallet: noopWallet,
} as unknown as AnchorProvider;
const anchorProgram = new Program(anchor030Devi as Idl, mockProvider);

// update_reward_infos has empty args + a single pool_state account — smallest reproducible instruction.
const UPDATE_REWARD_INFOS_DISCRIMINATOR = Uint8Array.from([163, 172, 224, 52, 11, 154, 106, 223]);

const buildInstruction = (data: Uint8Array, keys: PublicKey[]) =>
    new TransactionInstruction({
        data: Buffer.from(data),
        keys: keys.map(pubkey => ({ isSigner: false, isWritable: true, pubkey })),
        programId: anchorProgram.programId,
    });

const meta = {
    component: AnchorDetailsCard,
    decorators: [
        withMockTransactions,
        withTokenInfoBatch,
        Story => (
            <SignatureContext.Provider value="">
                <Story />
            </SignatureContext.Provider>
        ),
    ],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    // TODO(decode-instruction-with-idl): rename to a feature-scoped title once the Storybook tree migration off
    // the Dashkit layout lands; kept stable here to avoid churning the tree mid-move.
    title: 'Components/Instruction/AnchorDetailsCard',
} satisfies Meta<typeof AnchorDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const updateRewardInfosIx = buildInstruction(UPDATE_REWARD_INFOS_DISCRIMINATOR, [gen.publicKey(1)]);
export const UpdateRewardInfos: Story = {
    args: {
        decoded: decodeAnchorInstruction(anchorProgram, updateRewardInfosIx),
        index: 0,
        ix: updateRewardInfosIx,
        program: anchorProgram,
        result: { err: null },
        signature: '',
    },
};

// Synthetic data won't match any known discriminator → AnchorInstructionBody renders the "Failed to decode" fallback.
const failedToDecodeIx = buildInstruction(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), [gen.publicKey(2)]);
export const FailedToDecode: Story = {
    args: {
        decoded: decodeAnchorInstruction(anchorProgram, failedToDecodeIx),
        index: 1,
        ix: failedToDecodeIx,
        program: anchorProgram,
        result: { err: null },
        signature: '',
    },
};
