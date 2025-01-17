import { ParsedTransaction, PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import bs58 from 'bs58';

import { Ed25519DetailsCard } from '../Ed25519DetailsCard';

// Mock the dependencies
jest.mock('../../../common/Address', () => ({
    Address: ({ pubkey, alignRight, link }: { pubkey: PublicKey; alignRight?: boolean; link?: boolean }) => (
        <div data-testid="address" className={`${alignRight ? 'text-end' : ''} ${link ? 'text-link' : ''}`}>
            {pubkey.toBase58()}
        </div>
    ),
}));

jest.mock('../../../common/Copyable', () => ({
    Copyable: ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div data-testid="copyable" data-text={text}>
            {children}
        </div>
    ),
}));

jest.mock('../../InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card">
            <div>{title}</div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

describe('Ed25519DetailsCard', () => {
    const defaultProps = {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        result: { err: null },
    };

    it('renders basic Ed25519 verification instruction with single signature', () => {
        // 56JcSVYUPr8hdg8q2bfDhiPm5W9XQtr45VEevK9ye6Ec7DcyvD9CvnDgUoQhL3eQEmz32RRtLcaRdU9xyaDyCLiT (devnet)

        // Example of single signature verification
        const ed25519x = {
            data: Buffer.from('01000c0001004c0001006e008a000100', 'hex'),
            keys: [],
            programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
        };
        const programIx = {
            data: bs58.encode(
                Buffer.from(
                    '3259784efe0f688cec00000037d6acf4b3c9628b3485f398ed7baa20c37c4dff8ebee937456adea100d27c923e097cb0f41c9ff752efc7ed06db3c28bcf867f3ca203cde9222e72d1e93d503395311d51c1b87fd56c3b5872d1041111e51f399b12d291d981a0ea3834072958a00303030313031303034303432306630303030303030303030303030303030303030303030303030303031303030303030303030303030303030303031633830313939353235653733313730303030303030313330646465643337313730303030303030303030633866373165313530303030303030303334373337303431353433343533343830303030',
                    'hex'
                )
            ),
            keys: [
                {
                    isSigner: false,
                    isWritable: false,
                    pubkey: new PublicKey('5zpq7DvB6UdFFvpmBPspGPNfUGoBRRCE2HHg5u3gxcsN'),
                },
                {
                    isSigner: false,
                    isWritable: true,
                    pubkey: new PublicKey('UT4Qz3caSmEKEUmzQLxANRVxdZpcmdGJQ9bukQnxhRb'),
                },
                {
                    isSigner: false,
                    isWritable: true,
                    pubkey: new PublicKey('fxDKmzDYgHBmuzzgtnGzEwJsUZRL9oceLS1Sg1ytwCj'),
                },
                {
                    isSigner: false,
                    isWritable: true,
                    pubkey: new PublicKey('95Lgwzkf2P5Kbu2cubAwEvmWN3kjeS9njy6gLxQQ7rps'),
                },
                {
                    isSigner: true,
                    isWritable: true,
                    pubkey: new PublicKey('4rmhwytmKH1XsgGAUyUUH7U64HS5FtT6gM8HGKAfwcFE'),
                },
                // Ignore other keys in this ix for this test
            ].map(meta => ({
                ...meta,
                pubkey: meta.pubkey.toBase58(),
            })),
            programId: new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'),
        };

        // Very annoying thing about ed25519 is that all of its ix data has to reference
        // other outer instructions
        const tx = {
            message: {
                accountKeys: [],
                instructions: [ed25519x, programIx],
                recentBlockhash: '11111111111111111111111111111111',
            },
            signatures: [],
        } as unknown as ParsedTransaction;

        render(<Ed25519DetailsCard tx={tx} ix={ed25519x} {...defaultProps} />);

        const card = screen.getByTestId('instruction-card');

        // Check title
        expect(card).toHaveTextContent('Ed25519: Verify Signature');

        // Check signature details
        expect(card).toHaveTextContent('Signature #1');
        expect(card).toHaveTextContent('Signature Reference');
        expect(card).toHaveTextContent('Instruction 1, Offset 12');
        expect(card).toHaveTextContent(
            'UkJHZjY1ZHVSWUI4Q1Z3QXZUTTlGdThFNWlVNXpyZFQybnhoYjhzOVBpdlNzcHJZUVRyOHByRmZaVHNtVVV4Vg=='
        );

        // Check public key details
        expect(card).toHaveTextContent('Public Key Reference');
        expect(card).toHaveTextContent('Instruction 1, Offset 76');
        expect(card).toHaveTextContent('4rmhwytmKH1XsgGAUyUUH7U64HS5FtT6gM8HGKAfwcFE');

        // Check message details
        expect(card).toHaveTextContent('Message Reference');
        expect(card).toHaveTextContent('Instruction 1, Offset 110, Size 138');
        expect(card).toHaveTextContent(
            'Q1Z4RTlQZ1NIa29XbnluQUM2MkdZMnNnanVCSGtEdXZGOU5BVng2MlY2V0xFQlR2Y0pWUTdzWWY0RG9jQlg4am1CTjFqNXRUTERwTlp2Vzc5eE5wU0xKUDJnb3RGNW1pWWprQ2JMb1NRaWhRWEw2OXlvMmgyeTIxZTc4WEJ0cXFVSmdCbk1YUnhN'
        );
    });
});
