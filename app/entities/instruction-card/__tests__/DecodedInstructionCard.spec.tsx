import { gen } from '@__fixtures__/gen';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { InstructionArg } from '../model/args';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { DECODED_TABLE_COLUMNS, DecodedInstructionCard } from '../ui/DecodedInstructionCard';

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) => (
        <div>{overrideText ?? pubkey.toBase58()}</div>
    ),
}));

const STUB_SURFACE: InstructionSurface = {
    Shell: ({ children }) => (
        <table>
            <tbody>{children}</tbody>
        </table>
    ),
    result: { err: null },
};

const AMOUNT: InstructionArg = { kind: 'leaf', name: 'amount', type: 'number', value: { kind: 'text', value: '42' } };

describe('DecodedInstructionCard', () => {
    it('should span the Program row across the decoded table and show the program name', () => {
        renderCard({ programName: 'Counter' });

        const [label, value] = within(screen.getAllByRole('row')[0]).getAllByRole('cell');
        expect(label).toHaveTextContent('Program');
        expect(value).toHaveAttribute('colspan', String(DECODED_TABLE_COLUMNS - 1));
        expect(value).toHaveTextContent('Counter');
    });

    it('should render extra rows below the argument rows', () => {
        renderCard({
            children: (
                <tr data-testid="extra-row">
                    <td colSpan={DECODED_TABLE_COLUMNS} />
                </tr>
            ),
        });

        const rows = screen.getAllByRole('row');
        expect(rows.at(-2)).toHaveTextContent('amount');
        expect(rows.at(-1)).toHaveAttribute('data-testid', 'extra-row');
    });
});

function renderCard({ programName, children }: { programName?: string; children?: React.ReactNode }) {
    const ix = new TransactionInstruction({
        data: Buffer.from([1]),
        keys: [{ isSigner: true, isWritable: true, pubkey: gen.publicKey(1) }],
        programId: gen.publicKey(0),
    });

    return render(
        <InstructionSurfaceProvider surface={STUB_SURFACE}>
            <DecodedInstructionCard
                node={{ index: 0, ix, programId: ix.programId }}
                ix={ix}
                title="Counter: Increment"
                programName={programName}
                accountNames={['authority']}
                args={[AMOUNT]}
            >
                {children}
            </DecodedInstructionCard>
        </InstructionSurfaceProvider>,
    );
}
