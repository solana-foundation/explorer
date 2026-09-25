/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { useIdlInstructionDecode } from '@features/decode-instruction-with-idl';
import { getBase58Decoder } from '@solana/kit';
import type { CompiledInnerInstruction } from '@solana/web3.js';
import { MessageV0, PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

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

vi.mock('@features/decode-instruction-with-idl', async importOriginal => ({
    ...(await importOriginal<typeof import('@features/decode-instruction-with-idl')>()),
    useIdlInstructionDecode: vi.fn(() => undefined),
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

describe('Inspector InstructionsSection with inner instructions', () => {
    afterEach(() => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue(undefined);
    });

    test('should render a card per inner instruction under its parent', async () => {
        const { container } = render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection
                                    message={buildMessage()}
                                    compiledInnerInstructions={INNER_INSTRUCTIONS}
                                />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        // The header is only rendered when the parent has inner instruction cards.
        expect(await screen.findByText(/Inner Instructions/i)).toBeInTheDocument();

        const rendered = container.textContent ?? '';
        expect(rendered).toContain('#1.1');
        expect(rendered).toContain('#1.2');
        expect(rendered).toContain('#1.3');
        expect(rendered).toContain('#1.4');

        // The three Token CPIs render as raw cards because the IDL decoder is mocked to return
        // undefined and the dispatcher does not parse those discriminators.
        expect(await screen.findByText(/System Program: Create Account/i)).toBeInTheDocument();
    });

    test('should render an inner token batch as a batch card, not through the IDL decoder', async () => {
        // On mainnet the Token program has an IDL. The IDL decoder returns `{ kind: 'unknown' }`,
        // not `undefined`, when the IDL does not declare the discriminator.
        // The batch card must still render.
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'unknown' });

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection message={buildMessage()} compiledInnerInstructions={INNER_BATCH} />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        const title = await screen.findByText(/Token Program: Batch \(1 instruction\)/i);

        // The badge is in the same element as the title, so this asserts the batch card's own number.
        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(title.parentElement).toHaveTextContent('#1.1');
    });

    test('should number an inner ZK ElGamal Proof card under its parent', async () => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection
                                    message={buildMessage()}
                                    compiledInnerInstructions={INNER_ZK_CLOSE_CONTEXT_STATE}
                                />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        const title = await screen.findByText(/ZK ElGamal Proof Program: Close Context State/i);

        // eslint-disable-next-line testing-library/no-node-access -- the badge's card is what is under test
        expect(title.parentElement).toHaveTextContent('#1.2');
    });

    test('should number a child it cannot decompile so the siblings keep their positions', async () => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection
                                    message={buildMessage()}
                                    compiledInnerInstructions={INNER_WITH_BAD_ACCOUNT}
                                />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        expect(await screen.findByText(/Could not display instruction #1\.2, please report/i)).toBeInTheDocument();

        const rendered = document.body.textContent ?? '';
        expect(rendered).toContain('#1.1');
        expect(rendered).toContain('#1.3');
    });

    test('should render the curated card when the IDL declares nothing for the instruction', async () => {
        vi.mocked(useIdlInstructionDecode).mockReturnValue({ kind: 'unknown' });

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection message={buildMessage()} />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        expect(await screen.findByText(/Create Idempotent/i)).toBeInTheDocument();
    });

    test('should anchor a child it cannot decompile so a link to its number resolves', async () => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection
                                    message={buildMessage()}
                                    compiledInnerInstructions={INNER_WITH_BAD_ACCOUNT}
                                />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        await screen.findByText(/Could not display instruction #1\.2, please report/i);

        /* eslint-disable testing-library/no-node-access -- the anchor id is what is under test */
        expect(document.getElementById('ix-1-1')).not.toBeNull();
        expect(document.getElementById('ix-1-2')).not.toBeNull();
        expect(document.getElementById('ix-1-3')).not.toBeNull();
        /* eslint-enable testing-library/no-node-access */
    });

    test('should pass the same instructions to the IDL decoder across a re-render', async () => {
        const message = buildMessage();
        const tree = () => (
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection message={message} compiledInnerInstructions={INNER_INSTRUCTIONS} />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>
        );

        const { rerender } = render(tree());
        await screen.findByText(/Inner Instructions/i);

        vi.mocked(useIdlInstructionDecode).mockClear();
        rerender(tree());
        const first = vi.mocked(useIdlInstructionDecode).mock.calls.map(call => call[0].raw);
        vi.mocked(useIdlInstructionDecode).mockClear();
        rerender(tree());
        const second = vi.mocked(useIdlInstructionDecode).mock.calls.map(call => call[0].raw);

        expect(first).toHaveLength(5);
        expect(second.every((raw, position) => raw === first[position])).toBe(true);
    });

    test('should render no inner cards when the transaction carries no metadata', async () => {
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <TransactionsProvider>
                        <AccountsProvider>
                            <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                                <InstructionsSection message={buildMessage()} />
                            </InstructionParserProvider>
                        </AccountsProvider>
                    </TransactionsProvider>
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        expect(await screen.findByText(/Create Idempotent/i)).toBeInTheDocument();
        expect(screen.queryByText(/Inner Instructions/i)).not.toBeInTheDocument();
    });
});

const SYSTEM_PROGRAM = new PublicKey('11111111111111111111111111111111');
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ATA_PROGRAM = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
const ZK_ELGAMAL_PROOF_PROGRAM = new PublicKey('ZkE1Gama1Proof11111111111111111111111111111');

// The account list of the transaction in HOO-611, in wire order.
const ACCOUNT_KEYS = [
    new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ'), // 0 fee payer
    new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6'), // 1 source token account
    new PublicKey('CFRWXYp8zc2ftkF2Bv8jXmQu1qW67goZjSkKMjv6UV3P'), // 2 associated token account
    SYSTEM_PROGRAM, // 3
    new PublicKey('AGRidUXLeDij9CJprkZx7WBXtTQC67jtfiwz293mVrJ'), // 4 mint
    COMPUTE_BUDGET_PROGRAM, // 5
    TOKEN_PROGRAM, // 6
    new PublicKey('97PALEbpPj7muiQqi2HXS8QukLsrrr1yfgKfvXjWtsUG'), // 7 wallet
    ATA_PROGRAM, // 8
    ZK_ELGAMAL_PROOF_PROGRAM, // 9
];

// The four CPIs the RPC reports for the Create Idempotent instruction, verbatim
// from `getTransaction`: GetAccountDataSize, CreateAccount, InitializeImmutableOwner,
// InitializeAccount3.
const INNER_INSTRUCTIONS: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [4], data: '84eT', programIdIndex: 6 },
            {
                accounts: [0, 2],
                data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                programIdIndex: 3,
            },
            { accounts: [2], data: 'P', programIdIndex: 6 },
            { accounts: [2, 4], data: '6VF5qGS8cgaPcBCWMoBUrv6rJFETgGbHgNbVXR7RLC1uE', programIdIndex: 6 },
        ],
    },
];

// One Token program inner instruction with the batch discriminator (255). It contains a single
// Transfer of 100 over three accounts: source, destination, authority.
const INNER_BATCH: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            {
                accounts: [1, 2, 0],
                data: encodeBase58([255, 3, 9, 3, 100, 0, 0, 0, 0, 0, 0, 0]),
                programIdIndex: 6,
            },
        ],
    },
];

// A System CreateAccount followed by a ZK ElGamal Proof Close Context State (discriminator 0) over
// context state, destination, authority.
const INNER_ZK_CLOSE_CONTEXT_STATE: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            {
                accounts: [0, 2],
                data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                programIdIndex: 3,
            },
            { accounts: [1, 2, 0], data: encodeBase58([0]), programIdIndex: 9 },
        ],
    },
];

// Three CPIs. The middle one names an account index the message does not have.
const INNER_WITH_BAD_ACCOUNT: CompiledInnerInstruction[] = [
    {
        index: 0,
        instructions: [
            { accounts: [4], data: '84eT', programIdIndex: 6 },
            { accounts: [0, 99], data: 'P', programIdIndex: 6 },
            {
                accounts: [0, 2],
                data: '11119os1e9qSs2u7TsThXqkBSRVFxhmYaFKFZ1waB2X7armDmvK3p5GmLdUxYdg3h7QSrL',
                programIdIndex: 3,
            },
        ],
    },
];

// A single Create Idempotent instruction over the account list above. The real transaction has two
// more top-level instructions, and neither has inner instructions.
function buildMessage(): MessageV0 {
    return new MessageV0({
        addressTableLookups: [],
        compiledInstructions: [
            {
                accountKeyIndexes: [0, 2, 7, 4, 3, 6],
                data: new Uint8Array([1]),
                programIdIndex: 8,
            },
        ],
        header: {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 7,
            numRequiredSignatures: 1,
        },
        recentBlockhash: new PublicKey(new Uint8Array(32)).toBase58(),
        staticAccountKeys: ACCOUNT_KEYS,
    });
}

function encodeBase58(bytes: number[]): string {
    return getBase58Decoder().decode(new Uint8Array(bytes));
}
