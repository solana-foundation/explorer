/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { PMP_ADDRESS } from '@features/decode-instruction-pmp';
import { type MessageV0, PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getAllocateInstructionDataEncoder,
    getSetDataInstructionDataEncoder,
} from '@solana-program/program-metadata';
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

// The IDL tiers (`useAnchorProgram`, `useProgramMetadataIdl`) read through SWR. Stub it to "no IDL" so the PMP
// branch is exercised without a network-resolved IDL - which is exactly the case the p1 spec cares about.
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

function renderMessage(message: MessageV0) {
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

function buildMessage(data: Uint8Array): MessageV0 {
    const ix = new TransactionInstruction({
        data: Buffer.from(data),
        keys: [
            { isSigner: false, isWritable: true, pubkey: gen.publicKey(2) },
            { isSigner: false, isWritable: false, pubkey: gen.publicKey(3) },
        ],
        programId: new PublicKey(PMP_ADDRESS),
    });
    return new TransactionMessage({
        instructions: [ix],
        payerKey: gen.publicKey(0),
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

describe('Inspector InstructionsSection with a Program Metadata instruction', () => {
    test('should decode and render an inline setData payload with no IDL resolved', async () => {
        const data = getSetDataInstructionDataEncoder().encode({
            compression: Compression.None,
            data: new TextEncoder().encode('{"name":"company","version":"1.0.0"}'),
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
        }) as Uint8Array;

        renderMessage(buildMessage(data));

        expect(await screen.findByText(/ProgramMetadata: SetData/i)).toBeInTheDocument();

        // The section opens on the Raw tab and Radix unmounts the inactive panel, so the decoded document is only
        // in the DOM once the reader switches.
        await userEvent.click(screen.getByRole('tab', { name: 'Decoded' }));

        expect(screen.getByTestId('pmp-decoded-text')).toHaveTextContent('company');
    });

    test('should leave a housekeeping instruction to the existing tiers', async () => {
        const data = getAllocateInstructionDataEncoder().encode({ seed: 'idl' }) as Uint8Array;

        renderMessage(buildMessage(data));

        expect(await screen.findAllByText(/Program Metadata Program/i)).not.toHaveLength(0);
        expect(screen.queryByTestId('pmp-payload-section')).not.toBeInTheDocument();
    });
});
