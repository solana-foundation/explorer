import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import * as spl from '@solana/spl-token';
import { PublicKey, TransactionMessage } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

import { resolveAddressLookupTables } from '@/app/__tests__/mock-resolvers';
import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { intoParsedInstruction, intoParsedTransaction } from '../../inspector/into-parsed-data';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

vi.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: (_query?: string) => false,
    toString: () => '',
});

describe('instruction::AssociatedTokenDetailsCard', () => {
    test('should render "CreateIdempotentDetailsCard"', () => {
        const index = 1;
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const parsed = {
            account: new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'),
            mint: new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'),
            source: new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
            systemProgram: new PublicKey('11111111111111111111111111111111'),
            tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            wallet: new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
        };

        const ix = intoParsedInstruction(ti, parsed);
        const tx = intoParsedTransaction(ti, m);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        index={index}
                        result={{ err: null }}
                        tx={tx}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create Idempotent/)).toBeInTheDocument();
    });

    test('should render "CreateDetailsCard"', () => {
        const index = 2;
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const parsed = {
            account: new PublicKey(ti.keys[1].pubkey),
            mint: new PublicKey(ti.keys[3].pubkey),
            source: new PublicKey(ti.keys[0].pubkey),
            systemProgram: new PublicKey(ti.keys[4].pubkey),
            tokenProgram: new PublicKey(ti.keys[5].pubkey),
            wallet: new PublicKey(ti.keys[2].pubkey),
        };

        const ix = intoParsedInstruction(ti, parsed);
        const tx = intoParsedTransaction(ti, m);

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        index={index}
                        result={{ err: null }}
                        tx={tx}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Create$/)).toBeInTheDocument();
    });

    test('should render "RecoverNestedDetailsCard"', () => {
        const index = 0;
        const m = mock.deserializeMessage(stubs.aTokenRecoverNestedMsg);
        const lookups = resolveAddressLookupTables(m.addressTableLookups);
        const ti = TransactionMessage.decompile(m, {
            addressLookupTableAccounts: lookups,
        }).instructions[index];
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID)).toBeTruthy();

        const parsed = {
            destination: new PublicKey(ti.keys[2].pubkey),
            nestedMint: new PublicKey(ti.keys[1].pubkey),
            nestedOwner: new PublicKey(ti.keys[3].pubkey),
            nestedSource: new PublicKey(ti.keys[0].pubkey),
            ownerMint: new PublicKey(ti.keys[4].pubkey),
            tokenProgram: new PublicKey(ti.keys[6].pubkey),
            wallet: new PublicKey(ti.keys[5].pubkey),
        };

        const ix = intoParsedInstruction(ti, parsed);
        const tx = intoParsedTransaction(ti, m);

        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        ix={ix}
                        index={index}
                        result={{ err: null }}
                        tx={tx}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/Associated Token Program: Recover Nested/)).toBeInTheDocument();
    });
});
