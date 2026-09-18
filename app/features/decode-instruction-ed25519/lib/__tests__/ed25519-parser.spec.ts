import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { ed25519InstructionParser } from '../ed25519-client';
import { ED25519_PROGRAM_ADDRESS, ED25519_PROGRAM_LABEL, parseEd25519Instruction } from '../ed25519-parser';

const PROGRAM_ADDRESS = ED25519_PROGRAM_ADDRESS as Parameters<typeof parseEd25519Instruction>[0]['programAddress'];

describe('parseEd25519Instruction', () => {
    it('should decode the offsets table into the canonical shape', () => {
        const parsed = parseEd25519Instruction({
            accounts: [],
            data: new Uint8Array([1, 0, 48, 0, 0xff, 0xff, 16, 0, 0xff, 0xff, 112, 0, 32, 0, 0xff, 0xff]),
            programAddress: PROGRAM_ADDRESS,
        });

        expect(parsed).toEqual({
            info: {
                signatures: [
                    {
                        messageDataOffset: 112,
                        messageDataSize: 32,
                        messageInstructionIndex: 0xffff,
                        publicKeyInstructionIndex: 0xffff,
                        publicKeyOffset: 16,
                        signatureInstructionIndex: 0xffff,
                        signatureOffset: 48,
                    },
                ],
            },
            type: 'Verify',
        });
    });

    it('should decode a count with no structs to zero signatures', () => {
        const parsed = parseEd25519Instruction({
            accounts: [],
            data: new Uint8Array([1, 0]),
            programAddress: PROGRAM_ADDRESS,
        });

        expect(parsed).toEqual({ info: { signatures: [] }, type: 'Verify' });
    });

    it('should return undefined for data shorter than the count and padding', () => {
        expect(
            parseEd25519Instruction({ accounts: [], data: new Uint8Array([]), programAddress: PROGRAM_ADDRESS }),
        ).toBeUndefined();
        expect(
            parseEd25519Instruction({ accounts: [], data: new Uint8Array([1]), programAddress: PROGRAM_ADDRESS }),
        ).toBeUndefined();
    });
});

describe('ed25519InstructionParser', () => {
    const dispatcher = createInstructionParserDispatcher([ed25519InstructionParser]);

    it('should register under the precompile program id and label', () => {
        expect(dispatcher.canHandle(ED25519_PROGRAM_ADDRESS)).toBe(true);
        expect(dispatcher.getInstructionParser(ED25519_PROGRAM_ADDRESS)?.programLabel).toBe(ED25519_PROGRAM_LABEL);
    });

    it('should report a truncated instruction as registered-but-unparsed', () => {
        const dispatched = dispatcher.fromTransactionInstruction(
            new TransactionInstruction({
                data: Buffer.from([]),
                keys: [],
                programId: new PublicKey(ED25519_PROGRAM_ADDRESS),
            }),
        );

        expect(dispatched).toMatchObject({ programLabel: ED25519_PROGRAM_LABEL, unknown: true });
    });
});
