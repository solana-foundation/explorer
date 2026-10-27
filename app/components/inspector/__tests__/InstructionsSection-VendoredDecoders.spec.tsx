/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { gen } from '@__fixtures__/gen';
import { makeInstruction } from '@__fixtures__/instruction';
import { compileV0Message } from '@entities/transaction-data/__fixtures__/wire-transactions';
import { MANGO_PROGRAM_IDS } from '@explorer/decoder-mango';
import { OPEN_BOOK_PROGRAM_IDS, SERUM_DEX_V3_PROGRAM_IDS } from '@explorer/decoder-serum';
import { TOKEN_SWAP_PROGRAM_IDS } from '@explorer/decoder-token-swap';
import { WORMHOLE_PROGRAM_IDS } from '@explorer/decoder-wormhole';
import { getBase58Decoder } from '@solana/kit';
import type { CompiledInnerInstruction } from '@solana/web3.js';
import { MessageV0, PublicKey, SystemProgram } from '@solana/web3.js';
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

vi.mock('swr', async () => (await import('@/app/__tests__/swr-idle')).idleSwrModule);

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const PAYER = gen.publicKey(99);

// Authentic instruction data from mainnet OpenBook txs (2fHxffhsx9pJ… / 2DJ9K7gZfmtU…).
const NEW_ORDER_V3_DATA =
    '000a0000000100000050c30000000000000400000000000000400d03000000000000000000010000000000000000000000ffff';
const CONSUME_EVENTS_DATA = '00030000002000';
// Code 255 is outside the DEX name table.
const UNKNOWN_SERUM_DATA = '00ff000000';

describe('Inspector InstructionsSection with vendored decoder instructions', () => {
    test.each([
        {
            data: CONSUME_EVENTS_DATA,
            fields: ['Open Orders', 'Event Queue', 'Limit', '32'],
            keyCount: 6,
            title: 'OpenBook Dex Program: Consume Events',
        },
        {
            data: NEW_ORDER_V3_DATA,
            fields: ['Market', 'Open Orders Owner', 'Side', 'SELL', 'Limit Price', '50000'],
            keyCount: 12,
            title: 'OpenBook Dex Program: New Order v3',
        },
    ])(
        'should render decoded fields for the OpenBook instruction $title',
        async ({ data, fields, keyCount, title }) => {
            renderSection(buildMessage(OPEN_BOOK_PROGRAM_IDS.mainnet, hexBytes(data), keyCount));

            expect(await screen.findByText(title)).toBeInTheDocument();
            for (const field of fields) {
                expect(screen.getByText(field)).toBeInTheDocument();
            }
            expectNoGenericUnknownCard();
        },
    );

    test('should show the raw accounts and hex of a decoded OpenBook instruction on request', async () => {
        renderSection(buildMessage(OPEN_BOOK_PROGRAM_IDS.mainnet, hexBytes(CONSUME_EVENTS_DATA), 6));

        expect(await screen.findByText('OpenBook Dex Program: Consume Events')).toBeInTheDocument();
        expect(screen.queryByText(/Instruction Data/)).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(screen.getByText(/Instruction Data/)).toBeInTheDocument();
        expect(screen.getByText('Account #6')).toBeInTheDocument();
        expect(screen.queryByText('Event Queue')).not.toBeInTheDocument();
    });

    test('should render a deprecated Serum deployment name-only under its program name', async () => {
        renderSection(buildMessage(SERUM_DEX_V3_PROGRAM_IDS.mainnet, hexBytes(CONSUME_EVENTS_DATA), 6));

        expect(await screen.findByText('Serum Dex v3 (deprecated): Consume Events')).toBeInTheDocument();
        expect(screen.queryByText('Event Queue')).not.toBeInTheDocument();
        // The name-only card opens on its raw view.
        expect(screen.getByText(/Instruction Data/)).toBeInTheDocument();
        expectNoGenericUnknownCard();
    });

    test.each([
        { data: [2, 0, 0, 0], programId: MANGO_PROGRAM_IDS.mainnet, title: 'Mango v3 (deprecated): Deposit' },
        { data: [1], programId: TOKEN_SWAP_PROGRAM_IDS[0], title: 'Token Swap: Swap' },
        { data: [2], programId: WORMHOLE_PROGRAM_IDS[0], title: 'Wormhole: Post VAA' },
    ])('should title the $title instruction by name', async ({ data, programId, title }) => {
        renderSection(buildMessage(programId, data, 1));

        expect(await screen.findByText(title)).toBeInTheDocument();
        expectNoGenericUnknownCard();
    });

    test.each([
        {
            data: [255, 255, 0, 0],
            name: 'Mango',
            programId: MANGO_PROGRAM_IDS.mainnet,
            title: 'Mango v3 (deprecated): Unknown',
        },
        { data: [255], name: 'Token Swap', programId: TOKEN_SWAP_PROGRAM_IDS[0], title: 'Token Swap: Unknown' },
        { data: [255], name: 'Wormhole', programId: WORMHOLE_PROGRAM_IDS[0], title: 'Wormhole: Unknown' },
        {
            data: hexBytes(UNKNOWN_SERUM_DATA),
            name: 'OpenBook',
            programId: OPEN_BOOK_PROGRAM_IDS.mainnet,
            title: 'OpenBook Dex Program: Unknown',
        },
        {
            data: hexBytes(UNKNOWN_SERUM_DATA),
            name: 'a deprecated Serum deployment',
            programId: SERUM_DEX_V3_PROGRAM_IDS.mainnet,
            title: 'Serum Dex v3 (deprecated): Unknown',
        },
    ])(
        'should title an unrecognized $name instruction "Unknown" and open its raw view',
        async ({ data, programId, title }) => {
            renderSection(buildMessage(programId, data, 1));

            expect(await screen.findByText(title)).toBeInTheDocument();
            // The raw view is the card's whole content, so it opens without a click.
            expect(screen.getByText(/Instruction Data/)).toBeInTheDocument();
            expect(screen.getByText('Account #1')).toBeInTheDocument();
            expectNoGenericUnknownCard();
        },
    );

    test('should render vendored instructions as inner instructions under their parent', async () => {
        const { container } = renderSection(buildInnerMessage(), INNER_VENDORED_INSTRUCTIONS);

        expect(await screen.findByText(/Inner Instructions/)).toBeInTheDocument();

        const tokenSwap = await screen.findByText('Token Swap: Swap');
        const serum = await screen.findByText('OpenBook Dex Program: Consume Events');
        const unknown = await screen.findByText('Wormhole: Unknown');

        // The badge is in the same element as the title, so this asserts each inner card's own number.
        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(tokenSwap.parentElement).toHaveTextContent('#1.1');
        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(serum.parentElement).toHaveTextContent('#1.2');
        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(unknown.parentElement).toHaveTextContent('#1.3');

        // The decoded inner Serum card still decodes, and the unknown inner card still opens on raw.
        expect(screen.getByText('Event Queue')).toBeInTheDocument();
        expect(container.textContent).toContain('Instruction Data');
        expectNoGenericUnknownCard();
    });
});

const OPEN_BOOK_PROGRAM = new PublicKey(OPEN_BOOK_PROGRAM_IDS.mainnet);
const TOKEN_SWAP_PROGRAM = new PublicKey(TOKEN_SWAP_PROGRAM_IDS[0]);
const WORMHOLE_PROGRAM = new PublicKey(WORMHOLE_PROGRAM_IDS[0]);

// Account list of the inner-instruction message, in wire order: the fee payer, five writable accounts
// for the CPIs, then the three vendored programs and the System program (readonly).
const INNER_ACCOUNT_KEYS = [
    PAYER,
    ...[1, 2, 3, 4, 5].map(i => gen.publicKey(i)),
    TOKEN_SWAP_PROGRAM, // 6
    OPEN_BOOK_PROGRAM, // 7
    WORMHOLE_PROGRAM, // 8
    SystemProgram.programId, // 9
];

// A Token Swap Swap (tag 1), an OpenBook Consume Events over six accounts, and a Wormhole tag
// outside its name table.
const INNER_VENDORED_INSTRUCTIONS: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [1], data: encodeBase58([1]), programIdIndex: 6 },
            { accounts: [1, 2, 3, 4, 5, 0], data: encodeBase58([...hexBytes(CONSUME_EVENTS_DATA)]), programIdIndex: 7 },
            { accounts: [1], data: encodeBase58([255]), programIdIndex: 8 },
        ],
    },
];

function renderSection(message: MessageV0, compiledInnerInstructions?: CompiledInnerInstruction[]) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection
                                message={message}
                                compiledInnerInstructions={compiledInnerInstructions}
                            />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

// The generic Unknown card renders "<program name> Instruction"; a vendored card titles itself
// "<program name>: <instruction name>" instead.
function expectNoGenericUnknownCard() {
    expect(screen.queryByText('Instruction')).not.toBeInTheDocument();
}

function buildMessage(programId: string, data: Uint8Array | number[], keyCount: number): MessageV0 {
    const keys = Array.from({ length: keyCount }, (_, i) => gen.publicKey(i));
    return compileV0Message(PAYER, makeInstruction({ data, keys, programId }));
}

// A single System Transfer, so every vendored card in the inspector is an inner instruction.
function buildInnerMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [],
        compiledInstructions: [
            {
                accountKeyIndexes: [0, 1],
                data: new Uint8Array([2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
                programIdIndex: 9,
            },
        ],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 4, numRequiredSignatures: 1 },
        recentBlockhash: PublicKey.default.toBase58(),
        staticAccountKeys: INNER_ACCOUNT_KEYS,
    });
}

function hexBytes(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, 'hex'));
}

function encodeBase58(bytes: number[]): string {
    return getBase58Decoder().decode(new Uint8Array(bytes));
}
