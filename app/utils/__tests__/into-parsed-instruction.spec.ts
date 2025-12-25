import { SystemProgram } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { parseSystemInstruction } from '@/app/components/inspector/instruction-parsers/system-program.parser';
import { intoTransactionInstructionFromVersionedMessage } from '@/app/components/inspector/utils';

import { intoParsedInstruction } from '../parsed-tx';

describe('intoParsedInstruction', () => {
    test('should return ParsedInstruction compatible data for SystemProgram::transfer', async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);
        const ti = intoTransactionInstructionFromVersionedMessage(m.compiledInstructions[0], m);

        const ix = intoParsedInstruction(ti, undefined, parseSystemInstruction);

        expect(ix).toEqual({
            parsed: {
                info: {
                    accounts: {
                        destination: {
                            address: '2vPuXtAJLtxmkJRhuEwCuvUKyRemreh7q1DR4ns7wwzL',
                            role: 1,
                        },
                        source: {
                            address: '9yrYKJxZKktutPzhUNgS92bzVjpHkgZPNpZCHRr6M2TC',
                            role: 3,
                        },
                    },
                    data: {
                        amount: 1000000n,
                        discriminator: 2,
                    },
                    programAddress: SystemProgram.programId.toString(),
                },
                type: 'transfer',
            },
            program: 'system',
            programId: SystemProgram.programId,
        });
    });
});
