/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { toInstructionNode } from '@entities/instruction-card';
import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { OPEN_BOOK_PROGRAM_IDS, SERUM_DEX_V3_PROGRAM_IDS } from '@explorer/decoder-serum';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { findCell, readAddress, renderTxCard } from '@/app/__tests__/card-harness';

import { serumInstructionParsers } from '../../lib/serum-client';
import { SerumDetailsCard } from '../SerumDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

// Authentic instruction data from mainnet OpenBook txs (2fHxffhsx9pJ… / 2DJ9K7gZfmtU…).
const NEW_ORDER_V3_DATA =
    '000a0000000100000050c30000000000000400000000000000400d03000000000000000000010000000000000000000000ffff';
const CONSUME_EVENTS_DATA = '00030000002000';

const dispatcher = createInstructionParserDispatcher(serumInstructionParsers);

describe('@features/instruction-program-serum', () => {
    describe('SerumDetailsCard', () => {
        test('should render decoded fields for a New Order v3 instruction', async () => {
            renderCard(makeInstruction(NEW_ORDER_V3_DATA, 12));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: New Order v3/)).toBeInTheDocument();
            });
            expect(screen.getByText('Market')).toBeInTheDocument();
            expect(screen.getByText('Open Orders Owner')).toBeInTheDocument();
            expect(screen.getByText('Side')).toBeInTheDocument();
            expect(screen.getByText('SELL')).toBeInTheDocument();
            // enum values are humanized like labels, unlike `side`'s uppercase convention
            expect(screen.getByText('Self Trade Behavior')).toBeInTheDocument();
            expect(screen.getByText('Decrement Take')).toBeInTheDocument();
            expect(screen.getByText('Limit Price')).toBeInTheDocument();
            expect(screen.getByText('50000')).toBeInTheDocument();
            // the optional 13th account is absent, so its row must not render
            expect(screen.queryByText('Fee Discount Pubkey')).not.toBeInTheDocument();
        });

        test('should give every open-orders account its own row for a Consume Events instruction', async () => {
            // 6 keys: openOrders = keys[0..1], market = keys[2], eventQueue = keys[3]
            renderCard(makeInstruction(CONSUME_EVENTS_DATA, 6));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Consume Events/)).toBeInTheDocument();
            });
            expect(readAddress(findCell('Open Orders #1'))).toBe(gen.publicKey(0).toBase58());
            expect(readAddress(findCell('Open Orders #2'))).toBe(gen.publicKey(1).toBase58());
            expect(screen.getByText('Event Queue')).toBeInTheDocument();
            expect(screen.getByText('Limit')).toBeInTheDocument();
            expect(screen.getByText('32')).toBeInTheDocument();
        });

        test('should fall back to the raw card with an "Unknown" title for undecodable data', async () => {
            renderCard(makeInstruction('00ff000000', 0));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Unknown/)).toBeInTheDocument();
            });
            expect(screen.queryByText('Market')).not.toBeInTheDocument();
        });

        test('should render a deprecated Serum deployment name-only under its program name', async () => {
            renderCard(makeInstruction(CONSUME_EVENTS_DATA, 6, SERUM_DEX_V3_PROGRAM_IDS.mainnet));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/Serum Dex v3 \(deprecated\): Consume Events/)).toBeInTheDocument();
            });
            expect(screen.queryByText('Event Queue')).not.toBeInTheDocument();
        });

        test('should title an instruction on a deprecated deployment "Unknown" when its code is unrecognized', async () => {
            renderCard(makeInstruction('00ff000000', 0, SERUM_DEX_V3_PROGRAM_IDS.mainnet));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/Serum Dex v3 \(deprecated\): Unknown/)).toBeInTheDocument();
            });
        });

        test('should title a named code with no vendored layout from the name table', async () => {
            renderCard(makeInstruction('0007000000', 0));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: Disable Market/)).toBeInTheDocument();
            });
            expect(screen.queryByText('Market')).not.toBeInTheDocument();
        });

        test('should title a recognized code with a truncated payload by name', async () => {
            renderCard(makeInstruction('000a00000001', 0));

            // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
            await waitFor(() => {
                expect(screen.getByText(/OpenBook Dex Program: New Order v3/)).toBeInTheDocument();
            });
        });
    });
});

function makeInstruction(
    dataHex: string,
    keyCount: number,
    programId: string = OPEN_BOOK_PROGRAM_IDS.mainnet,
): TransactionInstruction {
    return new TransactionInstruction({
        data: Buffer.from(dataHex, 'hex'),
        keys: Array.from({ length: keyCount }, (_, i) => ({
            isSigner: false,
            isWritable: false,
            pubkey: gen.publicKey(i),
        })),
        programId: new PublicKey(programId),
    });
}

function renderCard(raw: TransactionInstruction) {
    const dispatched = dispatcher.fromTransactionInstruction(raw);
    if (!dispatched) throw new Error('no Serum parser registered for the fixture program id');

    return renderTxCard(
        <SerumDetailsCard
            node={toInstructionNode({ index: 0, ix: raw })}
            parsed={isParsedInstruction(dispatched) ? dispatched.parsed : undefined}
        />,
    );
}
