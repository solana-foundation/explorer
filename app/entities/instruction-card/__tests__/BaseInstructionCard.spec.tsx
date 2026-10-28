/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { TOKEN_2022_PROGRAM_ID } from '@providers/accounts/tokens';
import { SystemProgram } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { decompileStubInstruction } from '@/app/__tests__/mocks';
import { BaseTable } from '@/app/shared/ui/Table';

import { type InstructionNode, toInstructionNode } from '../model/node';
import { BaseInstructionCard } from '../ui/BaseInstructionCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

describe('BaseInstructionCard', () => {
    test('should render "BaseInstructionCard" with raw data', async () => {
        const index = 1;
        const { instruction } = decompileStubInstruction(stubs.aTokenCreateIdempotentMsg, index, {
            programId: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        });

        renderCard({ node: toInstructionNode({ index, ix: instruction }), title: 'Program: Instruction' });

        expect(await screen.findByText(/Program: Instruction/)).toBeInTheDocument();
        // instruction should relate to specific program
        expect(screen.getAllByText(/Associated Token Program/)).toHaveLength(1);
        // a card with no decoded view opens on the Raw view
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });

    test('should show a bigint of the decoded payload in the Raw view', async () => {
        const parsedIx = {
            parsed: { info: { maxSize: 100n }, type: 'initializeTokenGroup' },
            program: 'spl-token-2022',
            programId: TOKEN_2022_PROGRAM_ID,
        };

        renderCard({ node: toInstructionNode({ index: 0, ix: parsedIx }) });

        expect(await screen.findByText(/"maxSize": "100"/)).toBeInTheDocument();
    });

    test('should say so when the accounts and hex data cannot be reconstructed', async () => {
        renderCard({ rawSource: { kind: 'unavailable' } });

        expect(
            await screen.findByText(/Account list and hex data are not available for this transaction version/),
        ).toBeInTheDocument();
    });

    test('should fetch the raw instruction the first time the Raw view opens', async () => {
        const fetch = vi.fn();
        renderCard({ children: DECODED_ROW, rawSource: { fetch, kind: 'fetchable' } });

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));
        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should lock a card with no decoded view on the Raw view', () => {
        renderCard({});

        expect(screen.getByRole('button', { name: 'Raw' })).toBeDisabled();
    });
});

const DECODED_ROW = (
    <BaseTable.Row>
        <BaseTable.Cell>Decoded</BaseTable.Cell>
    </BaseTable.Row>
);

function renderCard(props: Partial<React.ComponentProps<typeof BaseInstructionCard>>) {
    return renderWithProviders(
        <BaseInstructionCard
            node={TRANSFER_NODE}
            title="System: Transfer"
            result={{ err: null }}
            rawSource={{ kind: 'none' }}
            collapsible={false}
            validateProgram={false}
            {...props}
        />,
        { transactions: false },
    );
}

const TRANSFER_NODE: InstructionNode = toInstructionNode({
    index: 0,
    ix: { parsed: { info: { lamports: 1 }, type: 'transfer' }, program: 'system', programId: SystemProgram.programId },
});
