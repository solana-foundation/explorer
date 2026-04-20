import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { Keypair, MessageAccountKeys, MessageV0, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { concatBytes, toBuffer } from '@/app/shared/lib/bytes';

import { BATCH_DISCRIMINATOR } from '../const';
import { resolveInnerBatchInstructions } from '../resolve-inner-batch-instructions';
import { encodeSubIx, makeTransferData } from './test-utils';

describe('resolveInnerBatchInstructions', () => {
    it('should return batch instructions grouped by parent index', () => {
        const keys = makeKeys(3);
        keys[2] = TOKEN_PROGRAM_ID;
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const result = resolveInnerBatchInstructions(
            [
                {
                    index: 0,
                    instructions: [
                        {
                            accounts: [0, 1],
                            data: makeBatchCompiledData([{ data: makeTransferData(100n), numAccounts: 2 }]),
                            programIdIndex: 2,
                        },
                    ],
                },
            ],
            accountKeys,
            message,
        );

        expect(result[0]).toHaveLength(1);
        expect(result[0][0].programId).toEqual(keys[2]);
    });

    it('should skip non-batch inner instructions', () => {
        const keys = makeKeys(4);
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const result = resolveInnerBatchInstructions(
            [
                {
                    index: 0,
                    instructions: [
                        {
                            accounts: [0, 1],
                            data: bs58.encode(new Uint8Array([1, 2, 3])),
                            programIdIndex: 3,
                        },
                    ],
                },
            ],
            accountKeys,
            message,
        );

        expect(result[0]).toBeUndefined();
    });

    it('should resolve signer and writable flags from the message', () => {
        // 5 accounts: [0]=writable signer, [1]=readonly signer, [2]=writable unsigned, [3]=readonly unsigned, [4]=token program (readonly)
        const keys = makeKeys(5);
        keys[4] = TOKEN_PROGRAM_ID;
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 1,
            numReadonlyUnsignedAccounts: 2,
            numRequiredSignatures: 2,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const result = resolveInnerBatchInstructions(
            [
                {
                    index: 0,
                    instructions: [
                        {
                            accounts: [0, 1, 2, 3],
                            data: makeBatchCompiledData([{ data: makeTransferData(50n), numAccounts: 4 }]),
                            programIdIndex: 4,
                        },
                    ],
                },
            ],
            accountKeys,
            message,
        );

        const ix = result[0][0];
        expect(ix.keys[0]).toMatchObject({ isSigner: true, isWritable: true });
        expect(ix.keys[1]).toMatchObject({ isSigner: true, isWritable: false });
        expect(ix.keys[2]).toMatchObject({ isSigner: false, isWritable: true });
        expect(ix.keys[3]).toMatchObject({ isSigner: false, isWritable: false });
    });

    it('should handle multiple parent indices', () => {
        const keys = makeKeys(3);
        keys[2] = TOKEN_2022_PROGRAM_ID;
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const batchData = makeBatchCompiledData([{ data: makeTransferData(1n), numAccounts: 2 }]);

        const result = resolveInnerBatchInstructions(
            [
                { index: 1, instructions: [{ accounts: [0, 1], data: batchData, programIdIndex: 2 }] },
                { index: 3, instructions: [{ accounts: [0, 1], data: batchData, programIdIndex: 2 }] },
            ],
            accountKeys,
            message,
        );

        expect(Object.keys(result)).toEqual(['1', '3']);
        expect(result[1]).toHaveLength(1);
        expect(result[3]).toHaveLength(1);
    });

    it('should skip instructions with out-of-range account indices', () => {
        const keys = makeKeys(3);
        keys[2] = TOKEN_PROGRAM_ID;
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const result = resolveInnerBatchInstructions(
            [
                {
                    index: 0,
                    instructions: [
                        {
                            accounts: [0, 99], // 99 is out of range
                            data: makeBatchCompiledData([{ data: makeTransferData(100n), numAccounts: 2 }]),
                            programIdIndex: 2,
                        },
                    ],
                },
            ],
            accountKeys,
            message,
        );

        expect(result[0]).toBeUndefined();
    });

    it('should return empty object for empty input', () => {
        const keys = makeKeys(2);
        const message = makeMessage(keys, {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 0,
            numRequiredSignatures: 1,
        });
        const accountKeys = new MessageAccountKeys(keys);

        const result = resolveInnerBatchInstructions([], accountKeys, message);

        expect(result).toEqual({});
    });
});

// Builds a minimal MessageV0 with the given static keys and header.
function makeMessage(
    keys: PublicKey[],
    header: { numRequiredSignatures: number; numReadonlySignedAccounts: number; numReadonlyUnsignedAccounts: number },
): MessageV0 {
    return new MessageV0({
        addressTableLookups: [],
        compiledInstructions: [],
        header,
        recentBlockhash: bs58.encode(new Uint8Array(32)),
        staticAccountKeys: keys,
    });
}

function makeKeys(count: number): PublicKey[] {
    return Array.from({ length: count }, () => Keypair.generate().publicKey);
}

function makeBatchCompiledData(subIxs: { numAccounts: number; data: Uint8Array }[]): string {
    const body = concatBytes(
        new Uint8Array([BATCH_DISCRIMINATOR]),
        ...subIxs.map(s => encodeSubIx(s.numAccounts, s.data)),
    );
    return bs58.encode(toBuffer(body));
}
