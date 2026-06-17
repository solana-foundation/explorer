import { gen } from '@__fixtures__/gen';
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withMockTransactions, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import React from 'react';

import anchor030Devi from '@/app/entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import AnchorDetailsCard from '../AnchorDetailsCard';
import { SignatureContext } from '../SignatureContext';

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

const ix = new TransactionInstruction({
    data: Buffer.from([163, 172, 224, 52, 11, 154, 106, 223]),
    keys: [{ isSigner: false, isWritable: true, pubkey: gen.publicKey(1) }],
    programId: anchorProgram.programId,
});

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
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
        withViewportFromGlobal,
    ],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/AnchorDetailsCard@Media',
} satisfies Meta<typeof AnchorDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    anchorProgram,
    index: 0,
    ix,
    result: { err: null },
    signature: '',
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
