import { gen } from '@__fixtures__/gen';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { AccountName } from '../model/accounts';
import type { InstructionArg } from '../model/args';
import { type InstructionFieldList, note, text } from '../model/fields';
import { toRawInstructionNode } from '../model/node';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { DECODED_TABLE_COLUMNS, DecodedInstructionCard } from '../ui/DecodedInstructionCard';

vi.mock('@/app/components/common/Address', () => ({
    Address: ({ pubkey, overrideText }: { pubkey: PublicKey; overrideText?: string }) => (
        <div>{overrideText ?? pubkey.toBase58()}</div>
    ),
}));

const STUB_SURFACE: InstructionSurface = {
    Card: () => undefined,
    collapsible: false,
    instructionData: () => undefined,
    rawInstructions: undefined,
    result: { err: null },
    signature: undefined,
    validateProgram: false,
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

    it('should render fields below the argument rows, spanning the decoded table', () => {
        renderCard({ fields: [text('Data Hash', 'abc'), note('This instruction carries no payload bytes.')] });

        const rows = screen.getAllByRole('row');
        expect(rows.at(-3)).toHaveTextContent('amount');
        const [label, value] = within(rows.at(-2) as HTMLElement).getAllByRole('cell');
        expect(label).toHaveTextContent('Data Hash');
        expect(value).toHaveAttribute('colspan', String(DECODED_TABLE_COLUMNS - 1));
        const [block] = within(rows.at(-1) as HTMLElement).getAllByRole('cell');
        expect(block).toHaveTextContent('This instruction carries no payload bytes.');
        expect(block).toHaveAttribute('colspan', String(DECODED_TABLE_COLUMNS));
    });

    it('should show the accounts of a group only after the group expands', () => {
        renderCard({
            accountCount: 2,
            accountNames: [
                { depth: 0, group: true, name: 'Withdraw Accounts' },
                { depth: 1, group: false, name: 'Owner' },
                { depth: 0, group: false, name: 'Payer' },
            ],
        });

        expect(screen.getByText('Payer')).toBeInTheDocument();
        expect(screen.queryByText('Owner')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Expand'));

        expect(screen.getByText('Owner')).toBeInTheDocument();
    });
});

function renderCard({
    programName,
    accountNames = ['authority'],
    accountCount = 1,
    fields,
}: {
    programName?: string;
    accountNames?: AccountName[];
    accountCount?: number;
    fields?: InstructionFieldList;
}) {
    const ix = new TransactionInstruction({
        data: Buffer.from([1]),
        keys: Array.from({ length: accountCount }, (_, i) => ({
            isSigner: true,
            isWritable: true,
            pubkey: gen.publicKey(i + 1),
        })),
        programId: gen.publicKey(0),
    });

    return render(
        <InstructionSurfaceProvider surface={STUB_SURFACE}>
            <DecodedInstructionCard
                node={toRawInstructionNode({ index: 0, ix })}
                title="Counter: Increment"
                programName={programName}
                accountNames={accountNames}
                args={[AMOUNT]}
                fields={fields}
            />
        </InstructionSurfaceProvider>,
    );
}
