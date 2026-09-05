import { generateKeyPairSigner, getBase58Decoder, type ReadonlyUint8Array, signBytes } from '@solana/kit';
import { PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TransactionSignatures } from '../SignaturesCard';

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));
vi.mock('@components/common/Signature', () => ({
    Signature: ({ signature }: { signature: string }) => <span>{signature}</span>,
}));

const base58Decoder = getBase58Decoder();
const { address: signerAddress, keyPair } = await generateKeyPairSigner();
const signerPublicKey = new PublicKey(signerAddress);

const message = new TransactionMessage({
    instructions: [new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.default })],
    payerKey: signerPublicKey,
    recentBlockhash: PublicKey.default.toBase58(),
}).compileToV0Message();
const rawMessage = message.serialize();

async function signMessage(messageBytes: ReadonlyUint8Array): Promise<string> {
    return base58Decoder.decode(await signBytes(keyPair.privateKey, messageBytes));
}

describe('TransactionSignatures', () => {
    it('should render a Valid badge for a signature covering the message', async () => {
        render(
            <TransactionSignatures
                signatures={[await signMessage(rawMessage)]}
                message={message}
                rawMessage={rawMessage}
            />,
        );

        expect(await screen.findByText('Valid')).toBeInTheDocument();
    });

    it('should render an Invalid badge for a signature covering different bytes', async () => {
        render(
            <TransactionSignatures
                signatures={[await signMessage(new Uint8Array(32))]}
                message={message}
                rawMessage={rawMessage}
            />,
        );

        expect(await screen.findByText('Invalid')).toBeInTheDocument();
    });

    it('should render an Invalid badge for a malformed signature instead of blanking the column', async () => {
        render(<TransactionSignatures signatures={['abc']} message={message} rawMessage={rawMessage} />);

        expect(await screen.findByText('Invalid')).toBeInTheDocument();
    });

    it('should render N/A for a missing signature', async () => {
        render(<TransactionSignatures signatures={[undefined]} message={message} rawMessage={rawMessage} />);

        expect(await screen.findByText('Missing Signature')).toBeInTheDocument();
        expect(await screen.findByText('N/A')).toBeInTheDocument();
    });

    it('should mark the first row as fee payer', async () => {
        render(
            <TransactionSignatures
                signatures={[await signMessage(rawMessage)]}
                message={message}
                rawMessage={rawMessage}
            />,
        );

        expect(await screen.findByText('Fee Payer')).toBeInTheDocument();
    });
});
