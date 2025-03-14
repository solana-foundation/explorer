import { ParsedTransaction, PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import bs58 from 'bs58';
import { vi } from 'vitest';

import { Ed25519DetailsCard } from '../Ed25519DetailsCard';

// Mock the dependencies
vi.mock('../../../common/Address', () => ({
    Address: ({ pubkey, alignRight, link }: { pubkey: PublicKey; alignRight?: boolean; link?: boolean }) => (
        <div data-testid="address" className={`${alignRight ? 'text-end' : ''} ${link ? 'text-link' : ''}`}>
            {pubkey.toBase58()}
        </div>
    ),
}));

vi.mock('../../../common/Copyable', () => ({
    Copyable: ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div data-testid="copyable" data-text={text}>
            {children}
        </div>
    ),
}));

vi.mock('../../InstructionCard', () => ({
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
            'N9as9LPJYos0hfOY7XuqIMN8Tf+Ovuk3RWreoQDSfJI+CXyw9Byf91Lvx+0G2zwovPhn88ogPN6SIuctHpPVAw=='
        );

        // Check public key details
        expect(card).toHaveTextContent('Public Key Reference');
        expect(card).toHaveTextContent('Instruction 1, Offset 76');
        expect(card).toHaveTextContent('4rmhwytmKH1XsgGAUyUUH7U64HS5FtT6gM8HGKAfwcFE');

        // Check message details
        expect(card).toHaveTextContent('Message Reference');
        expect(card).toHaveTextContent('Instruction 1, Offset 110, Size 138');
        expect(card).toHaveTextContent(
            'MDAwMTAxMDA0MDQyMGYwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDAwMDAwMDAwMDAxYzgwMTk5NTI1ZTczMTcwMDAwMDAwMTMwZGRlZDM3MTcwMDAwMDAwMDAwYzhmNzFlMTUwMDAwMDAwMDM0NzM3MDQxNTQzNDUzNDgwMDAw'
        );
    });

    it('renders basic Ed25519 verification instruction with self-contained single signature', () => {
        // XBHwdBYNu8J326yKeHiRyEudMaFVhz3Pb6ahgcfceRLV6kbmd14Z8vE6YnV4zu5WWNESmvhxmjUj4CpoQmwwhLJ

        // Example of single signature verification
        const ed25519x = {
            data: Buffer.from(
                '01003000ffff1000ffff70002000ffff8f2ed8bcd09b724040a0fc59ce9b5ea78525b6054def83d68f3a3930aa76e5bd4c105e1989c4d276372c97a5efb79d89bcc78f094f155be1b369e62e8b7eb42f42b3341f6be3b5c6f13a176fd7ca32323bf759c547126117365dccdae56e180f07932bbeab087035132975788c9af2a2c1a63e371e0866efcdb5a1952a1d2422',
                'hex'
            ),
            keys: [],
            programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
        };

        const tx = {
            message: {
                accountKeys: [],
                instructions: [ed25519x],
                recentBlockhash: '11111111111111111111111111111111',
            },
            signatures: [],
        } as unknown as ParsedTransaction;

        render(<Ed25519DetailsCard tx={tx} ix={ed25519x} {...defaultProps} />);

        const card = screen.getByTestId('instruction-card');

        // Check title
        expect(card).toHaveTextContent('Ed25519: Verify Signature');
        expect(card).toHaveTextContent('Signature #1');
        expect(card).toHaveTextContent('Signature Reference');
        expect(card).toHaveTextContent('This instruction, Offset 48');
        expect(card).toHaveTextContent(
            'TBBeGYnE0nY3LJel77edibzHjwlPFVvhs2nmLot+tC9CszQfa+O1xvE6F2/XyjIyO/dZxUcSYRc2Xcza5W4YDw=='
        );

        // Check public key details
        expect(card).toHaveTextContent('Public Key Reference');
        expect(card).toHaveTextContent('This instruction, Offset 16');
        expect(card).toHaveTextContent('AdvjU3gzNNXxASXEKBHovk3xAjFxQVn1UX6fUdgSvnS8');

        // Check message details
        expect(card).toHaveTextContent('Message Reference');
        expect(card).toHaveTextContent('This instruction, Offset 112, Size 32');
        expect(card).toHaveTextContent('B5MrvqsIcDUTKXV4jJryosGmPjceCGbvzbWhlSodJCI=');
    });

    it('renders card even when Ed25519 instruction contains invalid references', () => {
        // faked from XBHwdBYNu8J326yKeHiRyEudMaFVhz3Pb6ahgcfceRLV6kbmd14Z8vE6YnV4zu5WWNESmvhxmjUj4CpoQmwwhLJ

        // Example of failed single signature verification
        const ed25519x = {
            data: Buffer.from(
                '01003000fffe1000fffe70002000fffe8f2ed8bcd09b724040a0fc59ce9b5ea78525b6054def83d68f3a3930aa76e5bd4c105e1989c4d276372c97a5efb79d89bcc78f094f155be1b369e62e8b7eb42f42b3341f6be3b5c6f13a176fd7ca32323bf759c547126117365dccdae56e180f07932bbeab087035132975788c9af2a2c1a63e371e0866efcdb5a1952a1d2422',
                'hex'
            ),
            keys: [],
            programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
        };

        const tx = {
            message: {
                accountKeys: [],
                instructions: [ed25519x],
                recentBlockhash: '11111111111111111111111111111111',
            },
            signatures: [],
        } as unknown as ParsedTransaction;

        render(<Ed25519DetailsCard tx={tx} ix={ed25519x} {...defaultProps} />);

        const card = screen.getByTestId('instruction-card');

        // Check title
        expect(card).toHaveTextContent('Ed25519: Verify Signature');
        expect(card).toHaveTextContent('Signature #1');
        expect(card).toHaveTextContent('Signature Reference');
        expect(card).toHaveTextContent('Invalid reference');

        // Check public key details
        expect(card).toHaveTextContent('Public Key Reference');
        expect(card).toHaveTextContent('Invalid reference');

        // Check message details
        expect(card).toHaveTextContent('Message Reference');
        expect(card).toHaveTextContent('Invalid reference');
    });
});
