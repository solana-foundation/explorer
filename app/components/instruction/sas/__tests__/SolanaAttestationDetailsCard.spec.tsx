import { TxInstructionSurface } from '@entities/instruction-card';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: vi.fn(), has: vi.fn(), toString: () => '' })),
}));

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { TransactionsProvider } from '@/app/providers/transactions';

import { SolanaAttestationDetailsCard } from '../SolanaAttestationDetailsCard';

const SAS_PROGRAM_ID = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
const SYSTEM_PROGRAM = '11111111111111111111111111111111';

const ACCOUNTS = [
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
    '3EbFtRfKRMTrhPrRQjxbfWCB6NUyTQxwsWTKQFVKgNbb',
    '5rATVSqZjaHzMqSJmnbEQNmSJhaKMwsA7Zx2KfBWZBS4',
    '6dNUCJLdccKGSSQvQDNvQMKfWiV5j3XSTTGqNsCJ8mSA',
    '4QUZQ4c7bZuJ4o4L8tYAEGnePFV27SUFEVmC7BYfsXRp',
] as const;

const CREATE_CREDENTIAL = [0, 0, 0, 0, 0, 0, 0, 0, 0];

const CHANGE_SCHEMA_STATUS = [2, 1];

const CLOSE_ATTESTATION = [7];

describe('SolanaAttestationDetailsCard', () => {
    it('should render the accounts and arguments of a create credential', async () => {
        renderCard(sasInstruction(CREATE_CREDENTIAL, 4));

        await waitFor(() => {
            expect(readRows()).toEqual([
                ['Program', SAS_PROGRAM_ID.toBase58()],
                ['Account Name', 'Address'],
                ['Payer', ACCOUNTS[0]],
                ['Credential', ACCOUNTS[1]],
                ['Authority', ACCOUNTS[2]],
                ['SystemProgram', ACCOUNTS[3]],
                ['Argument Name', 'Type'],
                ['name', 'string'],
                ['signers', 'Array[0]'],
            ]);
        });

        expect(screen.getByText('Solana Attestation: Create Credential')).toBeInTheDocument();
    });

    // It is wire framing rather than an argument, and the account rows already name the instruction.
    it('should not render the discriminator as an argument', async () => {
        renderCard(sasInstruction(CREATE_CREDENTIAL, 4));

        await waitFor(() => {
            expect(screen.getByText('Argument Name')).toBeInTheDocument();
        });
        expect(screen.queryByText('discriminator')).not.toBeInTheDocument();
    });

    // The argument table adds a third column, and a row covering only two skews the ones that follow.
    it('should reach the argument table width on every row', async () => {
        renderCard(sasInstruction(CREATE_CREDENTIAL, 4));

        await waitFor(() => {
            expect(screen.getByText('Argument Name')).toBeInTheDocument();
        });

        expect(readNarrowRows()).toEqual([]);
    });

    it('should badge each account by its role and list an undeclared account as a remaining account', async () => {
        renderCard(
            new TransactionInstruction({
                data: Buffer.from(CREATE_CREDENTIAL),
                keys: [
                    { isSigner: true, isWritable: true, pubkey: new PublicKey(ACCOUNTS[0]) },
                    { isSigner: false, isWritable: true, pubkey: new PublicKey(ACCOUNTS[1]) },
                    { isSigner: true, isWritable: false, pubkey: new PublicKey(ACCOUNTS[2]) },
                    { isSigner: false, isWritable: false, pubkey: new PublicKey(ACCOUNTS[3]) },
                    { isSigner: false, isWritable: false, pubkey: new PublicKey(ACCOUNTS[4]) },
                ],
                programId: SAS_PROGRAM_ID,
            }),
        );

        await waitFor(() => {
            expect(readRows().slice(2, 7)).toEqual([
                ['PayerWritableSigner', ACCOUNTS[0]],
                ['CredentialWritable', ACCOUNTS[1]],
                ['AuthoritySigner', ACCOUNTS[2]],
                ['SystemProgram', ACCOUNTS[3]],
                ['Remaining Account #1', ACCOUNTS[4]],
            ]);
        });
    });

    it('should omit the argument table for an instruction that has none', async () => {
        renderCard(sasInstruction(CLOSE_ATTESTATION, 7));

        await waitFor(() => {
            expect(screen.getByText('Solana Attestation: Close Attestation')).toBeInTheDocument();
        });
        expect(screen.queryByText('Argument Name')).not.toBeInTheDocument();
        expect(readRows()).toHaveLength(9);
    });

    it('should render the only argument of an instruction that has one', async () => {
        renderCard(sasInstruction(CHANGE_SCHEMA_STATUS, 3));

        await waitFor(() => {
            expect(readRows().slice(-2)).toEqual([
                ['Argument Name', 'Type'],
                ['isPaused', 'boolean'],
            ]);
        });
    });

    // A foreign program id proves the row reads the node rather than the SAS constant.
    it('should render the program row from the node', async () => {
        const ix = sasInstruction(CLOSE_ATTESTATION, 7);

        renderCard(new TransactionInstruction({ ...ix, programId: new PublicKey(ACCOUNTS[0]) }));

        await waitFor(() => {
            expect(readRows()[0]).toEqual(['Program', ACCOUNTS[0]]);
        });
    });

    it.each([
        { accountCount: 1, data: [200], input: 'an unknown discriminator' },
        { accountCount: 1, data: CREATE_CREDENTIAL, input: 'too few accounts' },
        { accountCount: 3, data: [2], input: 'a truncated body' },
    ])('should render the Unknown card for $input', async ({ accountCount, data }) => {
        renderCard(sasInstruction(data, accountCount));

        await waitFor(() => {
            expect(screen.getByText('Unknown Instruction', { exact: false })).toBeInTheDocument();
        });
    });
});

function sasInstruction(data: number[], accountCount: number): TransactionInstruction {
    const keys = [...ACCOUNTS, SYSTEM_PROGRAM].slice(0, accountCount).map(pubkey => ({
        isSigner: false,
        isWritable: false,
        pubkey: new PublicKey(pubkey),
    }));

    return new TransactionInstruction({ data: Buffer.from(data), keys, programId: SAS_PROGRAM_ID });
}

function renderCard(ix: TransactionInstruction) {
    return render(
        <ScrollAnchorProvider>
            <ClusterProvider>
                <TransactionsProvider>
                    <AccountsProvider>
                        <TxInstructionSurface result={{ err: null }}>
                            <SolanaAttestationDetailsCard ix={ix} index={0} />
                        </TxInstructionSurface>
                    </AccountsProvider>
                </TransactionsProvider>
            </ClusterProvider>
        </ScrollAnchorProvider>,
    );
}

/**
 * Each row as `[first cell, second cell]`, in render order. The argument rows are three
 * cells wide, so for those the pair reads as name and type.
 */
function readRows(): Array<[string, string]> {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .map(row => {
            const cells = within(row).getAllByRole('cell');
            return [cells[0].textContent ?? '', readAddress(cells[1]) ?? cells[1]?.textContent ?? ''];
        });
}

/** Rows short of the argument table's three columns, named by their first cell. */
function readNarrowRows(): string[] {
    const card = screen.getAllByRole('table')[0];
    return within(card)
        .getAllByRole('row')
        .map(row => within(row).getAllByRole('cell'))
        .filter(cells => cells.reduce((columns, cell) => columns + columnsCovered(cell), 0) < 3)
        .map(cells => cells[0]?.textContent ?? '');
}

function columnsCovered(cell: HTMLElement): number {
    return Number(cell.getAttribute('colspan') ?? 1);
}

function readAddress(cell: HTMLElement | undefined): string | undefined {
    return cell?.querySelector('[data-address]')?.getAttribute('data-address') ?? undefined;
}
