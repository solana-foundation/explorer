import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { ProgramMetadataIdlInstructionDetailsCard } from '../ProgramMetadataIdlInstructionDetailsCard';

const parseInstruction = vi.fn();
const rootNodeFromAnchor = vi.fn();

vi.mock('@codama/dynamic-parsers', () => ({ parseInstruction: (...a: unknown[]) => parseInstruction(...a) }));
vi.mock('@codama/nodes-from-anchor', () => ({ rootNodeFromAnchor: (...a: unknown[]) => rootNodeFromAnchor(...a) }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'http://localhost' }) }));
vi.mock('@entities/idl', () => ({
    formatSerdeIdl: 'formatSerdeIdl',
    getFormattedIdl: (_fmt: unknown, idl: unknown) => idl,
    getProvider: () => ({}),
}));
vi.mock('@coral-xyz/anchor', () => ({
    // A Program built from the IDL — its existence is enough for the fallback path.
    Program: class {
        idl: unknown;
        constructor(idl: unknown) {
            this.idl = idl;
        }
    },
}));
vi.mock('../../AnchorDetailsCard', () => ({
    // Surface the signature so the test can assert it's forwarded (needed for event decoding).
    default: ({ signature }: { signature: string }) => <div data-testid="anchor-card">anchor:{signature}</div>,
}));
vi.mock('../../codama/CodamaInstructionDetailsCard', () => ({
    CodamaInstructionCard: () => <div data-testid="codama-card">codama decoded</div>,
}));
vi.mock('../../UnknownDetailsCard', () => ({
    UnknownDetailsCard: () => <div data-testid="unknown-card">unknown</div>,
}));

const ix = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [],
    programId: new PublicKey('vELoC1audYbSYVRXn1vPaV8Axoa9oU6BYmNGZZBDZ1P'),
});
const props = { index: 0, ix, result: { err: null } } as any;
const anchorIdl = { accounts: [], address: ix.programId.toBase58(), instructions: [{ name: 'foo' }] };

describe('ProgramMetadataIdlInstructionDetailsCard', () => {
    beforeEach(() => {
        parseInstruction.mockReset();
        rootNodeFromAnchor.mockReset();
    });

    it('should render the Codama card when the Codama parser succeeds', () => {
        parseInstruction.mockReturnValue({ accounts: [], path: [] });
        render(<ProgramMetadataIdlInstructionDetailsCard {...props} idl={anchorIdl} />);
        expect(screen.getByTestId('codama-card')).toBeInTheDocument();
    });

    it('should fall back to the Anchor card when Codama cannot parse the IDL', () => {
        // Mirror the real failure: parseInstruction throws and the anchor->codama conversion rejects
        // the IDL (e.g. an unnamed instruction arg).
        parseInstruction.mockImplementation(() => {
            throw new Error('not a root node');
        });
        rootNodeFromAnchor.mockImplementation(() => {
            throw new Error('Argument name [id] is missing from the instruction definition');
        });

        render(<ProgramMetadataIdlInstructionDetailsCard {...props} idl={anchorIdl} signature="SIG123" />);

        const card = screen.getByTestId('anchor-card');
        expect(card).toBeInTheDocument();
        // Signature is forwarded so the Anchor card can decode events from the tx logs.
        expect(card).toHaveTextContent('SIG123');
        expect(screen.queryByTestId('unknown-card')).not.toBeInTheDocument();
    });
});
