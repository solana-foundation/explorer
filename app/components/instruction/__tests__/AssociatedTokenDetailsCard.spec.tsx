import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import {
    clusterApiUrl,
    Connection,
    MessageCompiledInstruction,
    MessageV0,
    PublicKey,
    Transaction,
    VersionedMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';

import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { clusterUrl } from '@/app/utils/cluster';

import * as mock from '../../inspector/__tests__/mocks';
import {bs58} from '@coral-xyz/anchor/dist/cjs/utils/bytes';
//import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

jest.mock('next/navigation');
// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'devnet',
    has: (_query?: string) => false,
    toString: () => '',
});

describe('AssociatedTokenDetailsCard', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render ""', async () => {
        const compiledInstruction: MessageCompiledInstruction = {
            accountKeyIndexes: [],
            data: new Uint8Array([3, 100, 173, 109, 0, 0, 0, 0, 0]),
            programIdIndex: 6,
        };

        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            mock.deserialize(mock.message1),
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const c = new Connection(clusterApiUrl('devnet'));
        const m = mock.deserialize(mock.message1);

        const vm = new MessageV0({
            addressTableLookups: m.addressTableLookups.map(atl => {
                return {
                    accountKey: new PublicKey(atl.accountKey),
                    readonlyIndexes: atl.readonlyIndexes,
                    writableIndexes: atl.writableIndexes,
                };
            }),
            compiledInstructions: m.compiledInstructions.map(ci => {
                return {
                    accountKeyIndexes: ci.accountKeyIndexes,
                    data: new Uint8Array([...Object.values(ci.data)]),
                    programIdIndex: ci.programIdIndex,
                };
            }),
            header: m.header,
            recentBlockhash: Buffer.from((m.recentBlockhash)),
            staticAccountKeys: m.staticAccountKeys.map(sak => new PublicKey(sak)),
        });
        const vt = new VersionedTransaction(vm);

        console.log({ vm });

        console.log(6, await c.simulateTransaction(vt, { replaceRecentBlockhash: true, sigVerify: false }));

        expect(ti).not.toBeUndefined();
        expect(ti?.programId).toBe(spl.ASSOCIATED_TOKEN_PROGRAM_ID);

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>234</ClusterProvider>
            </ScrollAnchorProvider>
        );
        expect(screen.getByText(/234/)).toBeInTheDocument();
    });
});

/*
                    <AssociatedTokenDetailsCard
                        key={1}
                        ix={ti}
                        index={1}
                        result={{ err: null }}
                        signature={''}
                        //InstructionCardComponent={BaseInstructionCard}
                    />
                   */
