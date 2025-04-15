import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AddressLookupTableAccount, clusterApiUrl, Connection, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { BaseInstructionCard } from '../BaseInstructionCard';

describe('BaseInstructionCard', () => {
    test('should render "BaseInstructionCard"', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];

        expect(ti.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <BaseInstructionCard ix={ti} index={index} title="Program: Instruction" result={{ err: null }} />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        // check that card is rendered with proper title
        expect(screen.getByText(/Program: Instruction/)).toBeInTheDocument();
    });

    test('should render "BaseInstructionCard" with raw data', async () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const lookups = await Promise.all(
            m.addressTableLookups.map(lookup =>
                connection.getAddressLookupTable(lookup.accountKey).then(val => val.value)
            )
        );
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups.filter(x => x !== null) as AddressLookupTableAccount[],
        }).instructions[index];
        expect(ti.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

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
            </ScrollAnchorProvider>
        );
        // instruction should relate to specific program
        expect(await screen.findAllByText(/Associated Token Program/)).toHaveLength(2);
        // we expect specific internal component to be rendered with "defaultRaw"
        expect(screen.getByText('Instruction Data')).toBeInTheDocument();
    });
});
