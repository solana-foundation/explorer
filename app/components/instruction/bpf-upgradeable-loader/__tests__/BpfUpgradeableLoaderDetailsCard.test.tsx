import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { BpfUpgradeableLoaderDetailsCard } from '../BpfUpgradeableLoaderDetailsCard';

// Mock InstructionCard so the test doesn't pull in transaction/cluster providers; render the
// title and the attribute rows (children) inside a table, mirroring the Lighthouse test pattern.
vi.mock('../../InstructionCard', () => ({
    InstructionCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div data-testid="instruction-card" className="card">
            <div className="card-header">
                <div>{title}</div>
            </div>
            <table>
                <tbody>{children}</tbody>
            </table>
        </div>
    ),
}));

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <div data-testid="address">{pubkey.toBase58()}</div>,
}));

const BPF_UPGRADEABLE_LOADER_ID = 'BPFLoaderUpgradeab1e11111111111111111111111';

const defaultProps = {
    childIndex: undefined,
    index: 0,
    innerCards: undefined,
    result: { err: null },
    tx: { signatures: ['testsignature'] },
} as any;

describe('BpfUpgradeableLoaderDetailsCard', () => {
    const account = 'GcdayuLaLyrdmUu324nahyv33G5poQdLUEZ1nEytDeP';
    const authority = '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9';
    const newAuthority = 'Addo6uyKf6oRpiCfdj1HEN3PwQuJM7QyhBPCNqRPpwUC';

    it('should render Set Authority (Checked) instruction with all accounts and named args', () => {
        const ix = {
            parsed: {
                info: { account, authority, newAuthority },
                type: 'setAuthorityChecked',
            },
            program: 'bpf-upgradeable-loader',
            programId: new PublicKey(BPF_UPGRADEABLE_LOADER_ID),
        } as any;

        render(<BpfUpgradeableLoaderDetailsCard ix={ix} {...defaultProps} />);

        // Previously this instruction type was unhandled and fell back to the "Unknown
        // Instruction" raw view; it now renders a proper, titled card.
        expect(screen.getByText('BPF Upgradeable Loader: Set Authority Checked')).toBeInTheDocument();

        const accountRow = screen.getByTestId('ix-args-account');
        expect(accountRow).toHaveTextContent('Account');
        expect(accountRow).toHaveTextContent(account);

        const authorityRow = screen.getByTestId('ix-args-authority');
        expect(authorityRow).toHaveTextContent('Authority');
        expect(authorityRow).toHaveTextContent(authority);

        const newAuthorityRow = screen.getByTestId('ix-args-newAuthority');
        expect(newAuthorityRow).toHaveTextContent('New Authority');
        expect(newAuthorityRow).toHaveTextContent(newAuthority);
    });

    it('should still render the unchecked Set Authority instruction', () => {
        const ix = {
            parsed: {
                info: { account, authority, newAuthority },
                type: 'setAuthority',
            },
            program: 'bpf-upgradeable-loader',
            programId: new PublicKey(BPF_UPGRADEABLE_LOADER_ID),
        } as any;

        render(<BpfUpgradeableLoaderDetailsCard ix={ix} {...defaultProps} />);

        expect(screen.getByText('BPF Upgradeable Loader: Set Authority')).toBeInTheDocument();
        expect(screen.getByTestId('ix-args-newAuthority')).toHaveTextContent(newAuthority);
    });
});
