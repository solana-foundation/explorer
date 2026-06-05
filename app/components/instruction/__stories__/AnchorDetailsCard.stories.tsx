import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import React from 'react';

import anchor030Devi from '@/app/entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import AnchorDetailsCard from '../AnchorDetailsCard';
import { SignatureContext } from '../SignatureContext';

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
                <table className="e-w-full">
                    <tbody>
                        <Story />
                    </tbody>
                </table>
            </SignatureContext.Provider>
        ),
    ],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/AnchorDetailsCard',
} satisfies Meta<typeof AnchorDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpdateRewardInfos: Story = {
    args: {
        anchorProgram,
        index: 0,
        ix: buildInstruction(UPDATE_REWARD_INFOS_DISCRIMINATOR, [PublicKey.unique()]),
        result: { err: null },
        signature: '',
    },
};

// Synthetic data won't match any known discriminator → AnchorDetails renders the "Failed to decode" fallback.
export const FailedToDecode: Story = {
    args: {
        anchorProgram,
        index: 1,
        ix: buildInstruction(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]), [PublicKey.unique()]),
        result: { err: null },
        signature: '',
    },
};
