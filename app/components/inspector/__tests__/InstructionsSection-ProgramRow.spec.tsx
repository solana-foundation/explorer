import { gen } from '@__fixtures__/gen';
import { type MessageV0, PublicKey, SystemProgram, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

vi.mock('swr', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
    })),
}));

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const PAYER = gen.publicKey(0);
const TOKEN_PROGRAM = new PublicKey(TOKEN_PROGRAM_ADDRESS);

const TRANSFER_IX = new TransactionInstruction({
    data: Buffer.from([3, 1, 0, 0, 0, 0, 0, 0, 0]),
    keys: [
        { isSigner: false, isWritable: true, pubkey: gen.publicKey(1) },
        { isSigner: false, isWritable: true, pubkey: gen.publicKey(2) },
        { isSigner: true, isWritable: false, pubkey: PAYER },
    ],
    programId: TOKEN_PROGRAM,
});

const CREATE_IDEMPOTENT_IX = new TransactionInstruction({
    data: Buffer.from([1]),
    keys: [
        { isSigner: true, isWritable: true, pubkey: PAYER },
        { isSigner: false, isWritable: true, pubkey: gen.publicKey(3) },
        { isSigner: false, isWritable: false, pubkey: gen.publicKey(4) },
        { isSigner: false, isWritable: false, pubkey: gen.publicKey(5) },
        { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
        { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM },
    ],
    programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
});

describe('Inspector InstructionsSection Program row', () => {
    test.each([
        { ix: TRANSFER_IX, title: 'Token Program: Transfer' },
        { ix: CREATE_IDEMPOTENT_IX, title: 'Associated Token Program: Create Idempotent' },
    ])('should render one Program row for $title in the decoded and the raw view', async ({ ix, title }) => {
        renderSection(ix);

        expect(await screen.findByText(title)).toBeInTheDocument();
        expect(screen.getAllByText('Program')).toHaveLength(1);

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(screen.getAllByText('Program')).toHaveLength(1);
    });
});

function renderSection(ix: TransactionInstruction) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection message={buildMessage(ix)} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

function buildMessage(ix: TransactionInstruction): MessageV0 {
    return new TransactionMessage({
        instructions: [ix],
        payerKey: PAYER,
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}
