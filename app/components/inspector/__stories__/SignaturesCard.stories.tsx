import { PublicKey } from '@solana/web3.js';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TransactionSignatures } from '../SignaturesCard';

const SIGNER_2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const BOGUS_SIGNATURE = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';

const baseMessage = mockVersionedMessage({
    header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
        numRequiredSignatures: 2,
    },
    staticAccountKeys: [PublicKey.default, SIGNER_2],
});

const rawMessage = new Uint8Array(64);

const meta = {
    component: TransactionSignatures,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
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
