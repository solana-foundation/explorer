import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { ProgramMetadataIdlInstructionDetailsCard } from '../ProgramMetadataIdlInstructionDetailsCard';

// The card is a thin shim: it delegates the decode strategy to `decodeInstructionWithIdl` (tested in the
// feature) and only maps the result's `kind` to a renderer. So mock the feature boundary, not its
// internals, and assert the mapping + that inputs are forwarded.
const decodeInstructionWithIdl = vi.fn();

vi.mock('@features/decode-instruction-with-idl', () => ({
    decodeInstructionWithIdl: (...a: unknown[]) => decodeInstructionWithIdl(...a),
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'http://localhost' }) }));
vi.mock('../../AnchorDetailsCard', () => ({
    // Surface the signature so the test can assert it's forwarded (needed for event decoding).
    default: ({ signature }: { signature: string }) => <div data-testid="anchor-card">anchor:{signature}</div>,
}));
vi.mock('../../codama/CodamaInstructionDetailsCard', () => ({
    CodamaInstructionCard: () => <div data-testid="codama-card">codama</div>,
}));
vi.mock('../../UnknownDetailsCard', () => ({
    UnknownDetailsCard: () => <div data-testid="unknown-card">unknown</div>,
}));

const ix = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [],
    programId: PublicKey.unique(),
});
const idl = { kind: 'rootNode' };
const props = { idl, index: 0, ix, result: { err: null } } as any;

describe('ProgramMetadataIdlInstructionDetailsCard', () => {
    beforeEach(() => decodeInstructionWithIdl.mockReset());

    it('should render the Codama card for a codama decode and forward ix/idl/url to the decoder', () => {
        decodeInstructionWithIdl.mockReturnValue({ kind: 'codama', parsedIx: { accounts: [], path: [] } });

        render(<ProgramMetadataIdlInstructionDetailsCard {...props} />);

        expect(screen.getByTestId('codama-card')).toBeInTheDocument();
        expect(decodeInstructionWithIdl).toHaveBeenCalledWith(ix, idl, 'http://localhost');
    });

    it('should render the Anchor card and forward the signature for an anchor decode', () => {
        decodeInstructionWithIdl.mockReturnValue({ kind: 'anchor', program: {} });

        render(<ProgramMetadataIdlInstructionDetailsCard {...props} signature="SIG123" />);

        const card = screen.getByTestId('anchor-card');
        expect(card).toBeInTheDocument();
        expect(card).toHaveTextContent('SIG123');
    });

    it('should render the Unknown card for an unknown decode', () => {
        decodeInstructionWithIdl.mockReturnValue({ kind: 'unknown' });

        render(<ProgramMetadataIdlInstructionDetailsCard {...props} />);

        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });
});
