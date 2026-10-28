import { makeInstruction } from '@__fixtures__/instruction';
import { compileV0Message } from '@entities/transaction-data/__fixtures__/wire-transactions';
import { generateKeyPairSigner, getBase58Decoder, type ReadonlyUint8Array, signBytes } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TransactionSignatures } from '../SignaturesCard';

vi.mock('@components/common/Address', () => import('@/app/__tests__/address-stub'));
vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span>{signature}</span>,
}));

const base58Decoder = getBase58Decoder();
const { address: signerAddress, keyPair } = await generateKeyPairSigner();
const signerPublicKey = new PublicKey(signerAddress);

const message = compileV0Message(signerPublicKey, makeInstruction({ data: [1], programId: PublicKey.default }));
const rawMessage = message.serialize();

async function signMessage(messageBytes: ReadonlyUint8Array): Promise<string> {
    return base58Decoder.decode(await signBytes(keyPair.privateKey, messageBytes));
}

describe('TransactionSignatures', () => {
    it('should render a Valid badge on the fee payer row for a signature covering the message', async () => {
        render(
            <TransactionSignatures
                signatures={[await signMessage(rawMessage)]}
                message={message}
                rawMessage={rawMessage}
            />,
        );

        expect(await screen.findByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('Fee Payer')).toBeInTheDocument();
    });

    it.each([
        { name: 'a signature covering different bytes', signature: () => signMessage(new Uint8Array(32)) },
        { name: 'a malformed signature', signature: async () => 'abc' },
    ])('should render an Invalid badge for $name', async ({ signature }) => {
        render(<TransactionSignatures signatures={[await signature()]} message={message} rawMessage={rawMessage} />);

        expect(await screen.findByText('Invalid')).toBeInTheDocument();
    });

    it('should render N/A for a missing signature', async () => {
        render(<TransactionSignatures signatures={[undefined]} message={message} rawMessage={rawMessage} />);

        expect(await screen.findByText('Missing Signature')).toBeInTheDocument();
        expect(await screen.findByText('N/A')).toBeInTheDocument();
    });
});
