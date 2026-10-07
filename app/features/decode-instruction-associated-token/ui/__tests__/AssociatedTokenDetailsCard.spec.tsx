/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { associatedTokenInstructionParser } from '@features/decode-instruction-associated-token';
import { ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';
import * as stubs from '@/app/__tests__/mock-stubs';
import { decompileStubInstruction } from '@/app/__tests__/mocks';
import { InspectorInstructionCard } from '@/app/components/common/InspectorInstructionCard';
import { AddressWithContextCell } from '@/app/components/inspector/AddressWithContextCell';

import { AssociatedTokenDetailsCard } from '../AssociatedTokenDetailsCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const dispatcher = createInstructionParserDispatcher([associatedTokenInstructionParser]);

const CASES = [
    {
        index: 1,
        labels: [/Source/, /Account/, /Mint/, /Wallet/],
        name: 'Create Idempotent',
        programs: { system: 2, token: 2 },
        stub: stubs.aTokenCreateIdempotentMsg,
        title: /Associated Token Program: Create Idempotent/,
    },
    {
        index: 2,
        labels: [/Source/, /Account/, /Mint/, /Wallet/],
        name: 'Create',
        programs: { system: 2, token: 2 },
        stub: stubs.aTokenCreateMsgWithInnerCards,
        title: /Associated Token Program: Create$/,
    },
    {
        index: 0,
        labels: [/Destination/, /Nested Mint/, /Nested Owner/, /Nested Source/, /Owner Mint/, /^Owner$/],
        name: 'Recover Nested',
        programs: { system: 0, token: 2 },
        stub: stubs.aTokenRecoverNestedMsg,
        title: /Associated Token Program: Recover Nested/,
    },
];

const SHELLS = [
    { render: renderBaseCard, shell: 'BaseInstructionCard' },
    { render: renderInspectorCard, shell: 'InspectorInstructionCard' },
];

describe('AssociatedTokenDetailsCard', () => {
    it.each(CASES.flatMap(c => SHELLS.map(s => ({ ...c, ...s }))))(
        'should render the $name card in $shell',
        async ({ index, labels, programs, render, stub, title }) => {
            render(
                decompileStubInstruction(stub, index, { programId: ASSOCIATED_TOKEN_PROGRAM_ADDRESS }).instruction,
                index,
            );

            await waitFor(() => {
                expect(screen.getByText(title)).toBeInTheDocument();
            });
            labels.forEach(label => {
                expect(screen.getByText(label)).toBeInTheDocument();
            });
            expect(screen.queryAllByText(/^System Program$/)).toHaveLength(programs.system);
            expect(screen.queryAllByText(/^Token Program$/)).toHaveLength(programs.token);
        },
    );

    it('should render no inner instructions in the inspector', async () => {
        const index = 1;
        const { instruction } = decompileStubInstruction(stubs.aTokenCreateIdempotentMsgWithInnerCards, index, {
            programId: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        });

        renderInspectorCard(instruction, index);

        // Positive assertion forces waitFor to poll until the async render settles; the negative one alone would pass immediately.
        await waitFor(() => {
            expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
            expect(screen.queryByText(/Inner Instructions/)).not.toBeInTheDocument();
        });
    });

    // When this slice's parser rejects an RPC payload, the dispatcher falls back to
    // RPC's raw view: `type` still looks familiar but `info` holds base58 strings
    // rather than coerced PublicKeys. The card must degrade instead of throwing on
    // `pubkey.toBase58`.
    it.each(['create', 'createIdempotent', 'recoverNested'])(
        'should fall back to the unknown card when RPC info is not coerced (%s)',
        async type => {
            const rawInfoIx = {
                parsed: {
                    info: {
                        account: '9E3HDj8spudEWc26h5wu8EUpyfYDbJjjVYaZpv49nzGH',
                        mint: 'So11111111111111111111111111111111111111112',
                        source: 'Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx',
                    },
                    type,
                },
                program: 'spl-associated-token-account',
                programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
            } as unknown as ParsedInstruction;

            renderWithProviders(
                <AssociatedTokenDetailsCard
                    ix={rawInfoIx}
                    index={0}
                    result={{ err: null }}
                    InstructionCardComponent={BaseInstructionCard}
                />,
                { transactions: false },
            );

            await waitFor(() => {
                expect(screen.getByText(/Unknown Instruction/)).toBeInTheDocument();
            });
        },
    );
});

function renderBaseCard(instruction: TransactionInstruction, index: number) {
    return renderWithProviders(
        <AssociatedTokenDetailsCard
            ix={dispatch(instruction)}
            index={index}
            result={{ err: null }}
            InstructionCardComponent={BaseInstructionCard}
        />,
        { transactions: false },
    );
}

function renderInspectorCard(instruction: TransactionInstruction, index: number) {
    return renderWithProviders(
        <AssociatedTokenDetailsCard
            ix={dispatch(instruction)}
            raw={instruction}
            index={index}
            result={{ err: null }}
            InstructionCardComponent={InspectorInstructionCard}
            AddressComponent={AddressWithContextCell}
            showProgramField={false}
        />,
        { transactions: false },
    );
}

function dispatch(instruction: TransactionInstruction): ParsedInstruction {
    const ix = dispatcher.fromTransactionInstruction(instruction);
    if (!isParsedInstruction(ix)) throw new Error('AT slice did not recognise fixture');
    return ix;
}
