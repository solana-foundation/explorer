import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { intoTransactionInstructionFromVersionedMessage } from '@components/inspector/utils';
import * as spl from '@solana/spl-token';
import { VersionedTransaction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';

import { mockUseSearchParams } from '@/app/__tests__/utils';
import { ClusterProvider } from '@/app/providers/cluster';
import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import * as mock from '../../inspector/__tests__/mocks';
import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';
//import { AssociatedTokenDetailsCard } from '../associated-token/AssociatedTokenDetailsCard';

//const originalDecode = bs58.decode;
//// @ts-expect-error expect error as Uint8Array might not satisfy original type
//jest.spyOn(bs58, 'decode').mockImplementation((input: string): Uint8Array => {
//const original = originalDecode(input);

//return new Uint8Array(original);
//});

describe('AssociatedTokenDetailsCard', () => {
    beforeEach(() => {
        mockUseSearchParams();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should render "CreateIdempotentDetailsCard"', async () => {
        const compiledInstruction = mock.deserializeInstruction(mock.instruction2);

        const m = mock.deserializeMessageV0(mock.message2);
        const ti = intoTransactionInstructionFromVersionedMessage(
            compiledInstruction,
            m,
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        );

        //const c = new Connection(clusterApiUrl('mainnet-beta'));

        const vt = new VersionedTransaction(m);

        //vt.recentBlockhash = (await c.getLatestBlockhash()).blockhash

        //console.log(vt, { vm }, 'LENGTH:', m.recentBlockhash.length);

        console.log({ vm: m, vt });
        const index = 1;
        //const sim = await c.simulateTransaction(vt, {
        //accounts: {
        //addresses: [spl.ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()], //m.staticAccountKeys.map(ak => ak.toBase58()),
        //encoding: 'base64',
        //},
        //innerInstructions: false,
        //replaceRecentBlockhash: true,
        //sigVerify: false,
        //});

        //const ins = sim?.value.innerInstructions?.reduce((acc, n) => acc.concat(n?.instructions || []), []);

        //console.log({ sim }, sim?.value?.err, sim?.value.accounts, sim?.value.innerInstructions, 'I', ins);

        //console.log(bs58.decode(ins[0].data));

        expect(ti).not.toBeUndefined();
        expect(ti.programId.equals(spl.ASSOCIATED_TOKEN_PROGRAM_ID));

        // check that component is rendered properly
        render(
            <ScrollAnchorProvider>
                <ClusterProvider>
                    <AssociatedTokenDetailsCard
                        key={1}
                        ix={ti}
                        index={1}
                        result={{ err: null }}
                        signature={''}
                        InstructionCardComponent={BaseInstructionCard}
                    />
                </ClusterProvider>
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
