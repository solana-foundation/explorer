import { TxInstructionSurface } from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { BPF_LOADER_PROGRAM_ID, type ParsedInstruction, PublicKey } from '@solana/web3.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';
import { Logger } from '@/app/shared/lib/logger';

import { bpfLoaderInstructionParser } from '../../lib/bpf-loader-client';
import { BpfLoaderDetailsCard } from '../BpfLoaderDetailsCard';

const dispatcher = createInstructionParserDispatcher([bpfLoaderInstructionParser]);

const ACCOUNT = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const PROGRAM = BPF_LOADER_PROGRAM_ID.toBase58();

const BYTES = 'AgAAAA==';

describe('BpfLoaderDetailsCard', () => {
    beforeEach(() => {
        vi.mocked(Logger.error).mockClear();
    });

    it('should render the rows of a write', async () => {
        renderCard(dispatch('write', { account: ACCOUNT, bytes: BYTES, offset: 1024 }));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM],
                ['Account', ACCOUNT],
                ['Bytes (Base 64)', BYTES],
                ['Offset', '1024'],
            ]);
        });

        expect(screen.getByText('BPF Loader 2: Write')).toBeInTheDocument();
        expect(Logger.error).not.toHaveBeenCalled();
    });

    // A write carries a chunk of the program, so its base64 runs well past one line.
    it('should break write bytes longer than a line', async () => {
        const bytes = 'A'.repeat(60);

        renderCard(dispatch('write', { account: ACCOUNT, bytes, offset: 0 }));

        await waitFor(() => {
            expect(readRows()[2]).toEqual(['Bytes (Base 64)', ['A'.repeat(50), 'A'.repeat(10)].join('\n')]);
        });
    });

    it('should render the rows of a finalize', async () => {
        renderCard(dispatch('finalize', { account: ACCOUNT }));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', PROGRAM],
                ['Account', ACCOUNT],
            ]);
        });

        expect(screen.getByText('BPF Loader 2: Finalize')).toBeInTheDocument();
    });

    it('should fall back for an instruction type it does not decode', async () => {
        renderCard(dispatch('initializeBuffer', { account: ACCOUNT }));

        await waitFor(() => {
            expect(screen.getByText('BPF Loader 2: Unknown Instruction')).toBeInTheDocument();
        });
    });

    // The schemas are what stop a renamed or missing field reaching the rows uncoerced.
    it('should fall back and report a payload its schema rejects', async () => {
        renderCard(dispatch('write', { account: ACCOUNT, offset: 'not a number' }));

        await waitFor(() => {
            expect(screen.getByText('BPF Loader 2: Unknown Instruction')).toBeInTheDocument();
        });
        expect(Logger.error).toHaveBeenCalled();
    });

    // A foreign program id proves the row reads the node rather than a BPF-loader constant.
    it('should render the program row from the node', async () => {
        const loaderV1 = new PublicKey('BPFLoader1111111111111111111111111111111111');
        const ix = dispatch('finalize', { account: ACCOUNT });

        renderCard({ ...ix, programId: loaderV1 });

        await waitFor(() => {
            expect(readRows()[0]).toEqual(['Program', loaderV1.toBase58()]);
        });
    });
});

/** An RPC-parsed instruction, run through the dispatcher the way the tx page does. */
function dispatch(type: string, info: Record<string, unknown>): ParsedInstruction {
    return dispatcher.fromParsedInstruction({
        parsed: { info, type },
        program: 'bpf-loader',
        programId: BPF_LOADER_PROGRAM_ID,
    });
}

function renderCard(ix: ParsedInstruction) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <BpfLoaderDetailsCard ix={ix} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

/** Each row as `[label, value]`, in render order, so the result pins order as well as content. */
function readRows(): Array<[string, string]> {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? cells[1]?.textContent ?? ''];
        });
}

function readAddress(cell: HTMLElement | undefined): string | undefined {
    return cell?.querySelector('[data-address]')?.getAttribute('data-address') ?? undefined;
}
