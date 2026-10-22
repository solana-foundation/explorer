import { DEFAULT_SIGNATURE, gen } from '@__fixtures__/gen';
import { address, createNoopSigner, getBase58Decoder } from '@solana/kit';
import { type ParsedTransaction, PublicKey } from '@solana/web3.js';
import { getGetMinimumDelegationInstruction, getSplitInstruction, STAKE_PROGRAM_ADDRESS } from '@solana-program/stake';
import { screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

const BASE58_DECODER = getBase58Decoder();

const STAKE = gen.publicKey(1);
const SPLIT_STAKE = gen.publicKey(2);
const AUTHORITY = gen.publicKey(3);

const SPLIT = getSplitInstruction({
    args: 2_000_000_000n,
    splitStake: address(SPLIT_STAKE.toBase58()),
    stake: address(STAKE.toBase58()),
    stakeAuthority: createNoopSigner(address(AUTHORITY.toBase58())),
});

// The RPC hands back a stake instruction it could not parse as a PartiallyDecodedInstruction, so both
// instructions here take the raw path. `as unknown as` because the fixture carries only the fields
// the section reads.
const PARSED_TX = {
    message: {
        accountKeys: [
            { pubkey: STAKE, signer: false, source: 'transaction', writable: true },
            { pubkey: SPLIT_STAKE, signer: false, source: 'transaction', writable: true },
            { pubkey: AUTHORITY, signer: true, source: 'transaction', writable: false },
        ],
        addressTableLookups: null,
        instructions: [
            {
                accounts: [STAKE, SPLIT_STAKE, AUTHORITY],
                data: BASE58_DECODER.decode(SPLIT.data),
                programId: new PublicKey(STAKE_PROGRAM_ADDRESS),
            },
            {
                accounts: [],
                data: BASE58_DECODER.decode(getGetMinimumDelegationInstruction().data),
                programId: new PublicKey(STAKE_PROGRAM_ADDRESS),
            },
        ],
        recentBlockhash: PublicKey.default.toBase58(),
    },
    signatures: [DEFAULT_SIGNATURE],
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

vi.mock('@providers/transactions', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/transactions')>()),
    useTransactionDetails: vi.fn(() => ({
        data: { transactionWithMeta: { meta: null, slot: 1, transaction: PARSED_TX } },
    })),
    useTransactionStatus: vi.fn(() => ({ data: { info: { result: { err: null } } } })),
}));

describe('Transaction page InstructionsSection with raw stake instructions', () => {
    test('should decode the bytes into the cards the RPC-parsed path renders', async () => {
        renderWithProviders(<InstructionsSection signature={DEFAULT_SIGNATURE} />, {
            dispatcher: instructionParserDispatcher,
        });

        expect(await screen.findByText('Stake Program: Split Stake')).toBeInTheDocument();
        expect(screen.getByText('Stake Program: Get Minimum Delegation')).toBeInTheDocument();
        expect(screen.queryByText('Stake Program: Unknown Instruction')).not.toBeInTheDocument();
    });
});
