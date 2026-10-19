import { gen } from '@__fixtures__/gen';
import { VOTE_PROGRAM_ADDRESS } from '@explorer/parsers/programs/vote';
import { MessageV0, PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

// `useAnchorProgram` reads its IDL through SWR. The mock returns no data, so the instructions
// render through the dispatcher.
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

const PAYER = gen.publicKey(99);

// A u32 discriminant followed by a u64 of 1 SOL, the layout both programs use for these instructions.
const LAMPORTS_ARG = [0x00, 0xca, 0x9a, 0x3b, 0x00, 0x00, 0x00, 0x00];

describe('Inspector InstructionsSection with stake and vote instructions', () => {
    test.each([
        { data: [3, 0, 0, 0, ...LAMPORTS_ARG], programId: STAKE_PROGRAM_ADDRESS, title: 'Stake Program: Split Stake' },
        { data: [3, 0, 0, 0, ...LAMPORTS_ARG], programId: VOTE_PROGRAM_ADDRESS, title: 'Vote: Withdraw' },
    ])('should render $title from the raw bytes', async ({ data, programId, title }) => {
        renderSection(buildMessage(makeInstruction(programId, data, 3)));

        expect(await screen.findByText(title)).toBeInTheDocument();
        expect(screen.queryByText(text => text.endsWith(': Unknown Instruction'))).not.toBeInTheDocument();
    });

    test('should fall back to the unknown card for an unrecognized vote discriminant', async () => {
        renderSection(buildMessage(makeInstruction(VOTE_PROGRAM_ADDRESS, [250, 0, 0, 0], 3)));

        expect(await screen.findByText('Vote Program: Unknown Instruction')).toBeInTheDocument();
    });
});

function renderSection(message: MessageV0) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection message={message} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

function makeInstruction(programId: string, data: number[], keyCount: number): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(data),
        keys: Array.from({ length: keyCount }, (_, i) => ({
            isSigner: false,
            isWritable: false,
            pubkey: gen.publicKey(i),
        })),
        programId: new PublicKey(programId),
    });
}

function buildMessage(ix: TransactionInstruction): MessageV0 {
    return new TransactionMessage({
        instructions: [ix],
        payerKey: PAYER,
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}
