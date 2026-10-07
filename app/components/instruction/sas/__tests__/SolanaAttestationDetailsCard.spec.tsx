import { gen } from '@__fixtures__/gen';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import { readCardRows, renderTxCard } from '@/app/__tests__/card-harness';

import { SolanaAttestationDetailsCard } from '../SolanaAttestationDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const SAS_PROGRAM_ID = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
const SYSTEM_PROGRAM = '11111111111111111111111111111111';

const ACCOUNTS = [1, 2, 3, 4, 5, 6].map(seed => gen.address(seed));

/** CreateCredential: u8 discriminator 0, then a u32-prefixed name and a u32-prefixed signer list, both empty. */
const CREATE_CREDENTIAL = [0, 0, 0, 0, 0, 0, 0, 0, 0];

/** CloseAttestation carries nothing but its discriminator, so it has no arguments to tabulate. */
const CLOSE_ATTESTATION = [7];

describe('SolanaAttestationDetailsCard', () => {
    // The argument table adds a third column, and a row covering only two skews the ones that follow.
    it('should render the accounts and arguments of a create credential at the argument table width', async () => {
        renderCard(sasInstruction(CREATE_CREDENTIAL, 4));

        await waitFor(() => {
            expect(readCardRows()).toEqual([
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
        expect(readNarrowRows()).toEqual([]);
    });

    it('should omit the argument table for an instruction that has none', async () => {
        renderCard(sasInstruction(CLOSE_ATTESTATION, 7));

        await waitFor(() => {
            expect(screen.getByText('Solana Attestation: Close Attestation')).toBeInTheDocument();
        });
        expect(screen.queryByText('Argument Name')).not.toBeInTheDocument();
        expect(readCardRows()).toHaveLength(9);
    });

    // A foreign program id proves the row reads the node rather than the SAS constant.
    it('should render the program row from the node', async () => {
        const ix = sasInstruction(CLOSE_ATTESTATION, 7);

        renderCard(new TransactionInstruction({ ...ix, programId: new PublicKey(ACCOUNTS[0]) }));

        await waitFor(() => {
            expect(readCardRows()[0]).toEqual(['Program', ACCOUNTS[0]]);
        });
    });

    // The card leans on the caller's error boundary rather than inventing a fallback of its own.
    it('should throw for an instruction the program does not define', () => {
        const reportedError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => renderCard(sasInstruction([200], 1))).toThrow('could not be identified');

        reportedError.mockRestore();
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
    return renderTxCard(<SolanaAttestationDetailsCard ix={ix} index={0} />);
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
