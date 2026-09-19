import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { PYTH_INSTRUCTIONS, PYTH_ORACLE_PROGRAM_IDS } from '@explorer/decoder-pyth';
import { AccountRole, address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { pythInstructionParsers } from '../lib/pyth-client';
import { parsePythInstruction, PYTH_PROGRAM_LABEL } from '../lib/pyth-parser';

const FUNDING = address('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj');
const MAPPING = address('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');

function u32(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return [...bytes];
}

const INIT_MAPPING = new Uint8Array([...u32(2), ...u32(PYTH_INSTRUCTIONS.InitMapping.index)]);

describe('parsePythInstruction', () => {
    it('should decode a well-formed instruction to its canonical shape', () => {
        const parsed = parsePythInstruction({
            accounts: [
                { address: FUNDING, role: AccountRole.WRITABLE_SIGNER },
                { address: MAPPING, role: AccountRole.WRITABLE },
            ],
            data: INIT_MAPPING,
            programAddress: PYTH_ORACLE_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toEqual({ info: { fundingPubkey: FUNDING, mappingPubkey: MAPPING }, type: 'InitMapping' });
    });

    it('should return undefined rather than throw on a malformed instruction', () => {
        const parsed = parsePythInstruction({
            accounts: [],
            data: new Uint8Array([...u32(1), ...u32(0)]),
            programAddress: PYTH_ORACLE_PROGRAM_IDS.mainnet,
        });

        expect(parsed).toBeUndefined();
    });
});

describe('pythInstructionParsers', () => {
    it.each(Object.entries(PYTH_ORACLE_PROGRAM_IDS))(
        'should decode through the %s deployment',
        (_cluster, programId) => {
            const dispatcher = createInstructionParserDispatcher(pythInstructionParsers);
            const raw = new TransactionInstruction({
                data: Buffer.from(INIT_MAPPING),
                keys: [FUNDING, MAPPING].map(key => ({
                    isSigner: false,
                    isWritable: false,
                    pubkey: new PublicKey(key),
                })),
                programId: new PublicKey(programId),
            });

            const dispatched = dispatcher.fromTransactionInstruction(raw);

            expect(isParsedInstruction(dispatched)).toBe(true);
            if (!isParsedInstruction(dispatched)) return;
            expect(dispatched.program).toBe(PYTH_PROGRAM_LABEL);
            expect(dispatched.parsed).toEqual({
                info: { fundingPubkey: FUNDING, mappingPubkey: MAPPING },
                type: 'InitMapping',
            });
        },
    );
});
