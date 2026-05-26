import { PublicKey, VersionedMessage } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { TransactionSignatures } from '../SignaturesCard';

const FEE_PAYER = new PublicKey('11111111111111111111111111111111');
const SIGNER_2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const BOGUS_SIGNATURE = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';

const baseMessage = {
    addressTableLookups: [],
    compiledInstructions: [],
    header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
        numRequiredSignatures: 2,
    },
    recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm',
    staticAccountKeys: [FEE_PAYER, SIGNER_2],
    version: 0,
} as unknown as VersionedMessage;

const rawMessage = new Uint8Array(64);

const meta = {
    component: TransactionSignatures,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Inspector/SignaturesCard',
} satisfies Meta<typeof TransactionSignatures>;

export default meta;
type Story = StoryObj<typeof meta>;

// Bogus signatures will fail nacl verification → Invalid badges.
export const Invalid: Story = {
    args: {
        message: baseMessage,
        rawMessage,
        signatures: [BOGUS_SIGNATURE, BOGUS_SIGNATURE],
    },
};

export const MissingSignatures: Story = {
    args: {
        message: baseMessage,
        rawMessage,
        signatures: [undefined, undefined],
    },
};
