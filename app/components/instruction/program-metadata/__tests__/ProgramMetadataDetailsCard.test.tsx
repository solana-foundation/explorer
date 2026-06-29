import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getAllocateInstructionDataEncoder,
    getSetAuthorityInstructionDataEncoder,
} from '@solana-program/program-metadata';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { PROGRAM_METADATA_PROGRAM_ID, ProgramMetadataDetailsCard } from '../ProgramMetadataDetailsCard';

vi.mock('../../InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card">
            <div>{title}</div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

vi.mock('@components/common/HexData', () => ({ HexData: () => <span data-testid="hex" /> }));

const PROGRAM_ID = new PublicKey(PROGRAM_METADATA_PROGRAM_ID);
const defaultProps = { index: 0, result: { err: null } } as any;

describe('ProgramMetadataDetailsCard', () => {
    it('should decode an Allocate instruction and render its seed and labeled accounts', () => {
        const data = Buffer.from(getAllocateInstructionDataEncoder().encode({ seed: 'idl' }));
        const keys = Array.from({ length: 5 }, () => ({
            isSigner: false,
            isWritable: true,
            pubkey: PublicKey.unique(),
        }));
        const ix = new TransactionInstruction({ data, keys, programId: PROGRAM_ID });

        render(<ProgramMetadataDetailsCard ix={ix} {...defaultProps} />);

        expect(screen.getByText('Program Metadata Program: Allocate')).toBeInTheDocument();
        const seedRow = screen.getByTestId('ix-args-seed');
        expect(seedRow).toHaveTextContent('Seed');
        expect(seedRow).toHaveTextContent('idl');

        // Accounts are labeled by role, not just numbered.
        expect(screen.getByTestId('ix-account-0')).toHaveTextContent('Buffer');
        expect(screen.getByTestId('ix-account-1')).toHaveTextContent('Authority');
        expect(screen.getByTestId('ix-account-3')).toHaveTextContent('Program Data');
        expect(screen.getByTestId('ix-account-4')).toHaveTextContent('System');
    });

    it('should decode a SetAuthority instruction', () => {
        const data = Buffer.from(
            getSetAuthorityInstructionDataEncoder().encode({ newAuthority: PublicKey.default.toBase58() as any }),
        );
        const ix = new TransactionInstruction({ data, keys: [], programId: PROGRAM_ID });

        render(<ProgramMetadataDetailsCard ix={ix} {...defaultProps} />);

        expect(screen.getByText('Program Metadata Program: Set Authority')).toBeInTheDocument();
    });
});
