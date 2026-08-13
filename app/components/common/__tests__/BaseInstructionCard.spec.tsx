/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { SystemProgram, TransactionMessage } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { render, screen, waitFor } from '@testing-library/react';

import { resolveAddressLookupTables } from '@/app/__tests__/mock-resolvers';
import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { BaseInstructionCard } from '../BaseInstructionCard';

describe('BaseInstructionCard', () => {
    test('should render "BaseInstructionCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];

        expect(ti.programId.toBase58()).toBe(ASSOCIATED_TOKEN_PROGRAM_ADDRESS);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard ix={ti} index={index} title="Program: Instruction" result={{ err: null }} />
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // waitFor's act() boundary absorbs ClusterProvider's post-mount dispatch
        await waitFor(() => {
            expect(screen.getByText(/Program: Instruction/)).toBeInTheDocument();
        });
    });

    test('should render "BaseInstructionCard" with raw data', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.toBase58()).toBe(ASSOCIATED_TOKEN_PROGRAM_ADDRESS);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard
                        ix={ti}
                        index={index}
                        title="Program: Instruction"
                        result={{ err: null }}
                        defaultRaw
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );
        // instruction should relate to specific program
        expect(await screen.findAllByText(/Associated Token Program/)).toHaveLength(1);
        // we expect specific internal component to be rendered with "defaultRaw"
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });

    test('should say so when the accounts and hex data cannot be reconstructed', async () => {
        const parsedIx = {
            parsed: { info: { lamports: 1 }, type: 'transfer' },
            program: 'system',
            programId: SystemProgram.programId,
        };

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard
                        ix={parsedIx}
                        index={0}
                        title="System: Transfer"
                        result={{ err: null }}
                        defaultRaw
                        rawUnavailable
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>,
        );

        expect(
            await screen.findByText(/Account list and hex data are not available for this transaction version/),
        ).toBeInTheDocument();
    });
});
