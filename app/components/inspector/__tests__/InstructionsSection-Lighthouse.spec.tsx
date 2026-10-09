/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { LIGHTHOUSE_ADDRESS, LighthouseDetailsCard } from '@features/decode-instruction-lighthouse';
import { Keypair, type MessageV0, PublicKey, TransactionInstruction, TransactionMessage } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { InstructionParserProvider } from '@/app/entities/instruction-parser';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { instructionParserDispatcher } from '@/app/tx/instruction-parser-dispatcher';

import { InstructionsSection } from '../InstructionsSection';

// `useAnchorProgram` (checked before the program switch) reads through SWR;
// stub it to "no IDL" so the byte instruction falls through to the dispatcher.
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

vi.mock('@features/decode-instruction-lighthouse', async importOriginal => {
    const actual = await importOriginal<typeof import('@features/decode-instruction-lighthouse')>();
    return { ...actual, LighthouseDetailsCard: vi.fn(actual.LighthouseDetailsCard) };
});

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('Inspector InstructionsSection with a Lighthouse instruction', () => {
    afterEach(() => {
        vi.mocked(LighthouseDetailsCard).mockReset();
        vi.restoreAllMocks();
    });

    test('should decode and render a Lighthouse instruction via the unified dispatcher', async () => {
        const { container: c } = renderSection();

        // Title proves the whole path: the dispatcher decoded the raw bytes into
        // `{ program: 'lighthouse', type: 'Assert Sysvar Clock' }` and the
        // `case 'lighthouse'` arm rendered the card. (Before this work the
        // inspector fell through to UnknownDetailsCard for Lighthouse.)
        expect(await screen.findByText(/Lighthouse: Assert Sysvar Clock/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(
                findTableRowWithMatches(c, [
                    { columnIndex: 0, regex: /^Program$/ },
                    { columnIndex: 1, regex: /^Lighthouse$/ },
                ]),
            ).not.toBeNull();
        });
        expect(screen.getAllByText('Program')).toHaveLength(1);
    });

    test('should span the Program value across the Type and Value columns of the card body', async () => {
        const { container: c } = renderSection();

        expect(await findProgramValueCell(c)).toHaveAttribute('colspan', '2');
    });

    test('should not widen the Program row in the two-column raw view', async () => {
        const { container: c } = renderSection();

        await userEvent.click(await screen.findByRole('button', { name: 'Raw' }));

        expect(await findProgramValueCell(c)).not.toHaveAttribute('colspan');
    });

    test('should replace a Lighthouse card that throws with the Unknown card', async () => {
        const failure = new Error('lighthouse card failed');
        vi.mocked(LighthouseDetailsCard).mockImplementation(() => {
            throw failure;
        });
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        renderSection();

        expect(await screen.findByText('Lighthouse Program: Unknown Instruction')).toBeInTheDocument();
        expect(screen.queryByText(/Lighthouse: Assert Sysvar Clock/)).not.toBeInTheDocument();
    });
});

function renderSection() {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <InstructionParserProvider dispatcher={instructionParserDispatcher}>
                            <InstructionsSection message={buildLighthouseMessage()} />
                        </InstructionParserProvider>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

// A single-instruction v0 message carrying the "Assert Sysvar Clock" bytes
// (same fixture as the parser/card tests). No address-table lookups, so the
// inspector decompiles it without hydrating any tables.
function buildLighthouseMessage(): MessageV0 {
    const ix = new TransactionInstruction({
        data: Buffer.from([15, 0, 0, 166, 238, 134, 18, 0, 0, 0, 0, 3]),
        keys: [],
        programId: new PublicKey(LIGHTHOUSE_ADDRESS),
    });
    return new TransactionMessage({
        instructions: [ix],
        payerKey: Keypair.generate().publicKey,
        recentBlockhash: PublicKey.default.toBase58(),
    }).compileToV0Message();
}

async function findProgramValueCell(container: HTMLElement) {
    const row = await waitFor(() => {
        const match = findTableRowWithMatches(container, [{ columnIndex: 0, regex: /^Program$/ }]);
        expect(match).not.toBeNull();
        return match;
    });
    return row?.querySelectorAll('td')[1];
}

function findTableRowWithMatches(
    container: HTMLElement,
    matchers: Array<{ columnIndex: number; regex: RegExp }>,
): HTMLElement | null {
    // eslint-disable-next-line testing-library/no-node-access -- assert on raw table cells
    const rows = container.querySelectorAll('tr');
    const match = Array.from(rows).find(row => {
        // eslint-disable-next-line testing-library/no-node-access -- assert on raw table cells
        const cells = row.querySelectorAll('td');
        return matchers.every(
            m => m.columnIndex < cells.length && m.regex.test(cells[m.columnIndex].textContent || ''),
        );
    });
    return (match as HTMLElement) || null;
}
