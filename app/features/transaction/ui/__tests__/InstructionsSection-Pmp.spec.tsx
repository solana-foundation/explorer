/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
// From the literal's own library-free module: the feature no longer re-exports it, and this spec only needs the
// program id to build a fixture instruction - not the decoders that `@entities/pmp-account` would pull in.
import { PMP_ADDRESS } from '@entities/pmp-account/lib/program-address';
import { getBase58Decoder } from '@solana/kit';
import { type ParsedTransaction, PublicKey } from '@solana/web3.js';
import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getSetDataInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const BASE58_DECODER = getBase58Decoder();

const SIGNATURE = DEFAULT_SIGNATURE;
const AUTHORITY = gen.publicKey(0);
const METADATA = gen.publicKey(2);

const SET_DATA = getSetDataInstructionDataEncoder().encode({
    compression: Compression.None,
    data: new TextEncoder().encode('{"name":"company","version":"1.0.0"}'),
    dataSource: DataSource.Direct,
    encoding: Encoding.Utf8,
    format: Format.Json,
}) as Uint8Array;

// A minimal ParsedTransaction with one PMP instruction. `intoTransactionInstruction` looks each ix account up in
// `message.accountKeys` and base58-decodes `data`, so both have to line up for the raw path to produce an ix.
// Built once at module scope for a stable identity across renders. Safe to reference from the vi.mock factory
// below even though vi.mock is hoisted, because it is only ever READ inside the returned arrow, which runs at
// render time. `as unknown as` because the fixture carries only the fields the section actually reads.
const PARSED_TX = {
    message: {
        accountKeys: [
            { pubkey: METADATA, signer: false, source: 'transaction', writable: true },
            { pubkey: AUTHORITY, signer: true, source: 'transaction', writable: false },
        ],
        addressTableLookups: null,
        instructions: [
            {
                accounts: [METADATA, AUTHORITY],
                data: BASE58_DECODER.decode(SET_DATA),
                programId: new PublicKey(PMP_ADDRESS),
            },
        ],
        recentBlockhash: PublicKey.default.toBase58(),
    },
    signatures: [SIGNATURE],
} as unknown as ParsedTransaction;

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

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

// Override only the two cache reads the section makes. `importOriginal` keeps `TransactionsProvider` real, so the
// raw-details context the InstructionCard reads is still there.
vi.mock('@providers/transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions')>()),
    useTransactionDetails: vi.fn(() => ({
        data: { transactionWithMeta: { meta: null, slot: 1, transaction: PARSED_TX } },
    })),
    useTransactionStatus: vi.fn(() => ({ data: { info: { result: { err: null } } } })),
}));

describe('Transaction page InstructionsSection with a Program Metadata instruction', () => {
    test('should route an inline setData payload to the PMP card with no IDL resolved', async () => {
        renderWithProviders(<InstructionsSection signature={SIGNATURE} />, { dispatcher: instructionParserDispatcher });

        expect(await screen.findByText(/ProgramMetadata: SetData/i)).toBeInTheDocument();
    });
});
