import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';

import { upcastTransactionInstruction } from '../parsed-tx';

describe('upcastTransactionInstruction', () => {
    test('should return IInstruction compatible data', async () => {
        const m = mock.deserializeMessage(stubs.aTokenCreateMsgWithInnerCards);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[2], m);

        expect(upcastTransactionInstruction(ti)).toEqual({
            accounts: [
                { address: 'Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx', role: 3 },
                { address: '9E3HDj8spudEWc26h5wu8EUpyfYDbJjjVYaZpv49nzGH', role: 1 },
                { address: 'Hs9SPbfNiNofp5ngCgTmei5e1wu3dFfzELEoEBWbyPLx', role: 3 },
                { address: 'So11111111111111111111111111111111111111112', role: 0 },
                { address: '11111111111111111111111111111111', role: 0 },
                { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', role: 0 },
            ],
            data: Buffer.alloc(0),
            programAddress: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        });
    });
});
