import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { type InstructionNode, useInstructionSurface } from '@entities/instruction-card';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole/detection';
import { LIGHTHOUSE_ADDRESS } from '@features/decode-instruction-lighthouse';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
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

import { readCell } from '@/app/__tests__/card-harness';
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

const COMPUTE_BUDGET_IX = instruction(ComputeBudgetProgram.programId, [2]);

const WORMHOLE_IX = instruction(new PublicKey(WORMHOLE_PROGRAM_IDS[0]), [0]);

const IDL_PROGRAM_ID = gen.publicKey(2);

const IDL_IX = instruction(IDL_PROGRAM_ID, [1]);

const SIGN_METADATA_IX = instruction(new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID), [7]);

const ED25519_IX_POINTING_AT_INSTRUCTION_1 = instruction(
    new PublicKey('Ed25519SigVerify111111111111111111111111111'),
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
);

const REFERENCED_IX = instruction(gen.publicKey(3), Array(96).fill(7));

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

vi.mock('@features/decode-instruction-compute-budget', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-compute-budget')>()),
    ComputeBudgetDetailsCard: () => {
        throw new Error('compute budget card failed');
    },
}));

vi.mock('@entities/instruction-card', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/instruction-card')>()),
    NameOnlyDetailsCard: () => <div>{useInstructionSurface().signature}</div>,
}));

vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    IdlInstructionCard: ({ node }: { node: InstructionNode }) => (
        <div>{`IDL card ${node.index}/${node.childIndex}`}</div>
    ),
    useIdlInstructionDecode: ({ programId }: { programId: string }) =>
        programId === IDL_PROGRAM_ID.toBase58() ? { kind: 'anchor' } : undefined,
}));

vi.mock('@components/instruction/system/SystemDetailsCard', () => ({
    SystemDetailsCard: () => {
        throw new Error('system card failed');
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

    test('should replace an inner card that throws with the Unknown card', async () => {
        renderSection([UNKNOWN_SAS_IX], [COMPUTE_BUDGET_IX]);

        expect(await screen.findAllByText('Unknown Instruction', { exact: false })).toHaveLength(2);
        expect(screen.getByText('#1.1')).toBeInTheDocument();
    });

    test('should render the Unknown card for a parsed top-level instruction whose card throws', async () => {
        renderSection([PARSED_TRANSFER_IX]);

        expect(await screen.findByText('System Program: Unknown Instruction')).toBeInTheDocument();
    });

    test('should render the Unknown card for a parsed inner instruction whose card throws', async () => {
        renderSection([UNKNOWN_SAS_IX], [PARSED_TRANSFER_IX]);

        expect(await screen.findByText('System Program: Unknown Instruction')).toBeInTheDocument();
    });
});

describe('Transaction page InstructionsSection', () => {
    test('should pass the transaction signature to the instruction surface', async () => {
        renderSection([WORMHOLE_IX]);

        expect(await screen.findByText(DEFAULT_SIGNATURE)).toBeInTheDocument();
    });

    test('should pass the child index of an inner instruction to the IDL card', async () => {
        // The child index selects the invocation whose program events the card shows.
        renderSection([UNKNOWN_SAS_IX], [COMPUTE_BUDGET_IX, IDL_IX]);

        expect(await screen.findByText('IDL card 0/1')).toBeInTheDocument();
    });

    test('should resolve ed25519 offsets against the data of another instruction', async () => {
        renderSection([ED25519_IX_POINTING_AT_INSTRUCTION_1, REFERENCED_IX]);

        expect(await screen.findByText('Ed25519: Verify Signature')).toBeInTheDocument();
        expect(readCell('Signature')).toBe(Buffer.alloc(64, 7).toString('base64'));
    });
});

describe('Transaction page InstructionsSection with a Token Metadata instruction', () => {
    test('should render the decoded card with one Program row', async () => {
        renderSection([SIGN_METADATA_IX]);

        expect(await screen.findByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
        expect(screen.getAllByText('Program')).toHaveLength(1);
    });

    test('should render the inner instructions of a Token Metadata card', async () => {
        renderSection([SIGN_METADATA_IX], [UNKNOWN_SAS_IX]);

        expect(await screen.findByText('Token Metadata Program: Sign Metadata')).toBeInTheDocument();
        expect(screen.getByText('#1.1')).toBeInTheDocument();
    });
});

function instruction(programId: PublicKey, data: number[]): PartiallyDecodedInstruction {
    return { accounts: [], data: BASE58_DECODER.decode(new Uint8Array(data)), programId };
}

function renderSection(
    instructions: (ParsedInstruction | PartiallyDecodedInstruction)[],
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
