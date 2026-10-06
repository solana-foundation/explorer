import {
    createInstructionParserDispatcher,
    isParsedInstruction,
    toParsedTransaction,
} from '@entities/instruction-parser';
import { systemInstructionParser } from '@features/decode-instruction-system';
import { SystemProgram, TransactionMessage, VersionedMessage } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { type CardRow, readCardRows, renderTxCard } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { decompileStubInstruction } from '@/app/__tests__/mocks';

import { SystemDetailsCard } from '../system/SystemDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([systemInstructionParser]);

const PROGRAM = SystemProgram.programId.toBase58();
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const PAYER = 'paykgcZ547qCd1sm3kBn83t9Fnr2hxM6anLBXhV7Fhn';
const RECIPIENT = 'recvKuUhe9nsQ4QzrW68rTnzFT2S2dGmBKFNRfQB4Lp';
const DESTINATION = 'destqL3WARuT1i7W4tyMr7e62fc5PjoQzuu2Cbpsf2p';
const NONCE = 'NonCboKHT9aKXzy87SQxX5ZWZ3u8VRVf5G6pm5NimtR';
const NONCE_AUTHORITY = 'NautFCh9z5i4uN3ZCbEABf4ompPCPkzGzHKMcUbBUnf';

const CASES: Array<{ fixture: Fixture; rows: CardRow[]; title: string }> = [
    {
        fixture: fromJson(stubs.systemTransferMsg),
        rows: [
            ['Program', PROGRAM],
            ['From Address', '9yrYKJxZKktutPzhUNgS92bzVjpHkgZPNpZCHRr6M2TC'],
            ['To Address', '2vPuXtAJLtxmkJRhuEwCuvUKyRemreh7q1DR4ns7wwzL'],
            ['Transfer Amount (SOL)', '◎0.001'],
        ],
        title: 'System Program: Transfer',
    },
    {
        fixture: fromJson(stubs.systemTransferWithSeedMsg),
        rows: [
            ['Program', PROGRAM],
            ['From Address', '23fcFSBcrszjjqd66qeqptM17oWXERStDUafP4zLypT6'],
            ['Destination Address', '3j6YZsXi9FQrWvFp5TRN6AdQ81GY3GtNWq6imr3EawyF'],
            ['Base Address', PROGRAM],
            ['Transfer Amount (SOL)', '◎0.001'],
            ['Seed', 'example-seed-phrase'],
            ['Source Owner', PROGRAM],
        ],
        title: 'System Program: Transfer w/ Seed',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramCreateAccountWithSeedQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['From Address', PAYER],
            ['New Address', RECIPIENT],
            ['Base Address', 'Base4feziQk7rNDM1GfCnU6BMAUQiY7MBtJ7qctugFJp'],
            ['Seed', 'test-seed'],
            ['Transfer Amount (SOL)', '◎0.002'],
            ['Allocated Data Size', '200 byte(s)'],
            ['Assigned Program Id', ATA_PROGRAM],
        ],
        title: 'System Program: Create Account w/ Seed',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramAllocateQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Account Address', RECIPIENT],
            ['Allocated Data Size', '300 byte(s)'],
        ],
        title: 'System Program: Allocate Account',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramAssignQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Account Address', RECIPIENT],
            ['Assigned Program Id', ATA_PROGRAM],
        ],
        title: 'System Program: Assign Account',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramTransferQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['From Address', PAYER],
            ['To Address', DESTINATION],
            ['Transfer Amount (SOL)', '◎0.005'],
        ],
        title: 'System Program: Transfer',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramAdvanceNonceQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Nonce Address', NONCE],
            ['Authority Address', NONCE_AUTHORITY],
        ],
        title: 'System Program: Advance Nonce',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramWithdrawNonceQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Nonce Address', NONCE],
            ['Authority Address', NONCE_AUTHORITY],
            ['To Address', DESTINATION],
            ['Withdraw Amount (SOL)', '◎0.001'],
        ],
        title: 'System Program: Withdraw Nonce',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramAuthorizeNonceQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Nonce Address', NONCE],
            ['Old Authority Address', NONCE_AUTHORITY],
            ['New Authority Address', DESTINATION],
        ],
        title: 'System Program: Authorize Nonce',
    },
    {
        fixture: fromQueryParam(stubs.systemProgramInitializeNonceQueryParam),
        rows: [
            ['Program', PROGRAM],
            ['Nonce Address', NONCE],
            ['Authority Address', NONCE_AUTHORITY],
        ],
        title: 'System Program: Initialize Nonce',
    },
];

describe('instruction::SystemDetailsCard', () => {
    it.each(CASES)('should render $title', async ({ fixture: { instruction, message }, rows, title }) => {
        const parsedIx = dispatcher.fromTransactionInstruction(instruction);
        if (!isParsedInstruction(parsedIx)) throw new Error('System slice did not recognise fixture');

        renderTxCard(
            <SystemDetailsCard
                index={0}
                ix={parsedIx}
                raw={instruction}
                result={{ err: null }}
                tx={toParsedTransaction(instruction, message, [parsedIx])}
            />,
        );

        await waitFor(() => {
            expect(screen.getByText(title)).toBeInTheDocument();
        });
        expect(readCardRows()).toEqual(rows);
    });
});

type Fixture = ReturnType<typeof fromJson>;

function fromJson(stub: string) {
    return decompileStubInstruction(stub, 0, { programId: PROGRAM });
}

function fromQueryParam(param: string): Fixture {
    const message = VersionedMessage.deserialize(Buffer.from(decodeURIComponent(param), 'base64'));
    return { instruction: TransactionMessage.decompile(message).instructions[0], message };
}
