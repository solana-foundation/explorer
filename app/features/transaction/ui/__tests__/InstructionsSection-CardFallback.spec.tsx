import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { LIGHTHOUSE_ADDRESS } from '@features/decode-instruction-lighthouse';
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from '@solana/attestation';
import { getBase58Decoder } from '@solana/kit';
import {
    ComputeBudgetProgram,
    type ParsedInstruction,
    type ParsedTransaction,
    type PartiallyDecodedInstruction,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { INNER_INSTRUCTIONS_START_SLOT } from '@utils/index';
import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const BASE58_DECODER = getBase58Decoder();
const PAYER = gen.publicKey(0);

const LIGHTHOUSE_IX = instruction(new PublicKey(LIGHTHOUSE_ADDRESS), [15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]);

const UNKNOWN_SAS_IX = instruction(new PublicKey(SAS_PROGRAM_ID), [200]);

const CREATE_CREDENTIAL_IX = instruction(new PublicKey(SAS_PROGRAM_ID), [0]);

const COMPUTE_BUDGET_IX = instruction(ComputeBudgetProgram.programId, [2]);

const PARSED_TRANSFER_IX: ParsedInstruction = {
    parsed: {
        info: { destination: gen.publicKey(1).toBase58(), lamports: 1, source: PAYER.toBase58() },
        type: 'transfer',
    },
    program: 'system',
    programId: SystemProgram.programId,
};

let transactionWithMeta: { meta: unknown; slot: number; transaction: ParsedTransaction };

vi.mock('@features/decode-instruction-lighthouse', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-lighthouse')>()),
    LighthouseDetailsCard: () => {
        throw new Error('lighthouse card failed');
    },
}));

vi.mock('@components/instruction/ComputeBudgetDetailsCard', () => ({
    ComputeBudgetDetailsCard: () => {
        throw new Error('compute budget card failed');
    },
}));

vi.mock('@components/instruction/system/SystemDetailsCard', () => ({
    SystemDetailsCard: () => {
        throw new Error('system card failed');
    },
}));

vi.mock('@solana/attestation', async importOriginal => ({
    ...(await importOriginal<typeof import('@solana/attestation')>()),
    parseCreateCredentialInstruction: () => {
        throw new Error('sas parser defect');
    },
}));

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

vi.mock('@providers/transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions')>()),
    useTransactionDetails: vi.fn(() => ({ data: { transactionWithMeta } })),
    useTransactionStatus: vi.fn(() => ({ data: { info: { result: { err: null } } } })),
}));

describe('Transaction page InstructionsSection with a card that throws', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should replace a Lighthouse card that throws with the Unknown card', async () => {
        renderSection([LIGHTHOUSE_IX]);

        expect(await screen.findAllByText('Unknown Instruction', { exact: false })).toHaveLength(1);
    });

    test('should render the Unknown card for a SAS instruction the client rejects', async () => {
        renderSection([UNKNOWN_SAS_IX]);

        expect(await screen.findAllByText('Unknown Instruction', { exact: false })).toHaveLength(1);
    });

    test('should replace a SAS card that throws with the Unknown card', async () => {
        renderSection([CREATE_CREDENTIAL_IX]);

        expect(await screen.findAllByText('Unknown Instruction', { exact: false })).toHaveLength(1);
    });

    test('should replace an inner card that throws with the Unknown card', async () => {
        renderSection([UNKNOWN_SAS_IX], [COMPUTE_BUDGET_IX]);

        expect(await screen.findAllByText('Unknown Instruction', { exact: false })).toHaveLength(2);
        expect(screen.getByText('#1.1')).toBeInTheDocument();
    });

    test('should render the Unknown card for a parsed inner instruction whose card throws', async () => {
        renderSection([UNKNOWN_SAS_IX], [PARSED_TRANSFER_IX]);

        expect(await screen.findByText('System Program: Unknown Instruction')).toBeInTheDocument();
    });
});

function instruction(programId: PublicKey, data: number[]): PartiallyDecodedInstruction {
    return { accounts: [], data: BASE58_DECODER.decode(new Uint8Array(data)), programId };
}

function renderSection(
    instructions: PartiallyDecodedInstruction[],
    inner: (ParsedInstruction | PartiallyDecodedInstruction)[] = [],
) {
    transactionWithMeta = {
        meta: { innerInstructions: [{ index: 0, instructions: inner }] },
        slot: INNER_INSTRUCTIONS_START_SLOT,
        transaction: {
            message: {
                accountKeys: [{ pubkey: PAYER, signer: true, source: 'transaction', writable: true }],
                addressTableLookups: null,
                instructions,
                recentBlockhash: PublicKey.default.toBase58(),
            },
            signatures: [DEFAULT_SIGNATURE],
        } as unknown as ParsedTransaction,
    };

    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection signature={DEFAULT_SIGNATURE} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}
