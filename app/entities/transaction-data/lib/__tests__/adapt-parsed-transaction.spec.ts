import { gen } from '@__fixtures__/gen';
import { SystemProgram } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { adaptParsedTransaction, type RpcParsedTransaction } from '../adapt-parsed-transaction';

const FEE_PAYER = gen.address(1);
const RECIPIENT = gen.address(2);
const SYSTEM_PROGRAM = SystemProgram.programId.toBase58();
const MINT = gen.address(3);
const BLOCKHASH = gen.blockhash();

type RpcMeta = NonNullable<RpcParsedTransaction['meta']>;

function createMeta(overrides: Partial<RpcMeta> = {}): RpcMeta {
    return {
        computeUnitsConsumed: 8442n,
        costUnits: 3234,
        err: null,
        fee: 5000n,
        innerInstructions: [
            {
                index: 0,
                instructions: [{ accounts: [FEE_PAYER], data: '3Bxs4', programId: SYSTEM_PROGRAM }],
            },
        ],
        loadedAddresses: { readonly: [RECIPIENT], writable: [FEE_PAYER] },
        logMessages: [`Program ${SYSTEM_PROGRAM} invoke [1]`],
        postBalances: [900_000_000n, 100_000_000n],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: MINT,
                owner: RECIPIENT,
                programId: SYSTEM_PROGRAM,
                // `uiAmount` is not on kit's allow-list, so a whole-number balance is a bigint.
                uiTokenAmount: { amount: '15000000', decimals: 6, uiAmount: 15n, uiAmountString: '15' },
            },
        ],
        preBalances: [1_000_000_000n, 0n],
        ...overrides,
    };
}

function createResponse(overrides: Partial<RpcParsedTransaction> = {}): RpcParsedTransaction {
    return {
        blockTime: 1_778_761_079n,
        meta: createMeta(),
        slot: 372_654_321n,
        transaction: {
            message: {
                accountKeys: [
                    { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                    { pubkey: RECIPIENT, signer: false, source: 'lookupTable', writable: true },
                ],
                instructions: [
                    {
                        // Nothing inside a parsed instruction is on kit's allow-list, so every
                        // integral value in here arrives as a bigint.
                        parsed: {
                            info: { destination: RECIPIENT, lamports: 100_000_000n, source: FEE_PAYER },
                            type: 'transfer',
                        },
                        program: 'system',
                        programId: SYSTEM_PROGRAM,
                    },
                ],
                recentBlockhash: BLOCKHASH,
            },
            signatures: [gen.signature(1)],
        },
        version: 0n,
        ...overrides,
    };
}

describe('adaptParsedTransaction', () => {
    it('should narrow the RPC bigints web3.js consumers expect as numbers', () => {
        const result = adaptParsedTransaction(createResponse());

        expect(result.slot).toBe(372_654_321);
        expect(result.blockTime).toBe(1_778_761_079);
        expect(result.meta?.fee).toBe(5000);
        expect(result.meta?.computeUnitsConsumed).toBe(8442);
        expect(result.meta?.preBalances).toEqual([1_000_000_000, 0]);
        expect(result.meta?.postBalances).toEqual([900_000_000, 100_000_000]);
    });

    it('should keep costUnits, which kit does not type but the RPC serves', () => {
        expect(adaptParsedTransaction(createResponse()).meta?.costUnits).toBe(3234);
        expect(adaptParsedTransaction(createResponse({ meta: null })).meta).toBeNull();
    });

    it('should wrap every address in a PublicKey', () => {
        const result = adaptParsedTransaction(createResponse());
        const [feePayer, recipient] = result.transaction.message.accountKeys;

        expect(feePayer.pubkey.toBase58()).toBe(FEE_PAYER);
        expect(feePayer.source).toBe('transaction');
        expect(recipient.source).toBe('lookupTable');
        expect(result.meta?.loadedAddresses?.writable[0].toBase58()).toBe(FEE_PAYER);
        expect(result.meta?.loadedAddresses?.readonly[0].toBase58()).toBe(RECIPIENT);
    });

    it('should adapt parsed and partially decoded instructions, including inner ones', () => {
        const result = adaptParsedTransaction(createResponse());
        const [instruction] = result.transaction.message.instructions;
        const [innerInstruction] = result.meta?.innerInstructions?.[0].instructions ?? [];

        expect(instruction).toMatchObject({ parsed: { type: 'transfer' }, program: 'system' });
        expect(instruction.programId.toBase58()).toBe(SYSTEM_PROGRAM);
        expect(innerInstruction).toMatchObject({ data: '3Bxs4' });
        expect('accounts' in innerInstruction && innerInstruction.accounts[0].toBase58()).toBe(FEE_PAYER);
    });

    it('should pass token balances through with their stringified amounts intact', () => {
        const [postTokenBalance] = adaptParsedTransaction(createResponse()).meta?.postTokenBalances ?? [];

        expect(postTokenBalance).toEqual({
            accountIndex: 1,
            mint: MINT,
            owner: RECIPIENT,
            programId: SYSTEM_PROGRAM,
            uiTokenAmount: { amount: '15000000', decimals: 6, uiAmount: 15, uiAmountString: '15' },
        });
        expect(typeof postTokenBalance.uiTokenAmount.uiAmount).toBe('number');
    });

    // Cards render these payloads with JSON.stringify, which throws on a bigint, and the receipt
    // model validates them against superstruct `number()` schemas.
    it('should leave no bigint anywhere in the adapted transaction', () => {
        const result = adaptParsedTransaction(
            createResponse({ meta: createMeta({ err: { InstructionError: [1n, { Custom: 6001n }] } }) }),
        );

        expect(() => JSON.stringify(result)).not.toThrow();
        expect(findBigIntPath(result)).toBeUndefined();
    });

    it('should convert instruction error indices and codes so the error formatters can do arithmetic', () => {
        const response = createResponse({
            meta: createMeta({ err: { InstructionError: [1n, { Custom: 6001n }] } }),
        });

        expect(adaptParsedTransaction(response).meta?.err).toEqual({ InstructionError: [1, { Custom: 6001 }] });
    });

    it('should convert numbers nested inside a parsed instruction', () => {
        const [instruction] = adaptParsedTransaction(createResponse()).transaction.message.instructions;

        expect('parsed' in instruction && instruction.parsed.info.lamports).toBe(100_000_000);
    });

    it.each([
        ['legacy' as const, 'legacy'],
        [0n, 0],
        [1n, 1],
    ])('should narrow version %s to %s', (version, expected) => {
        expect(adaptParsedTransaction(createResponse({ version })).version).toBe(expected);
    });

    it('should tolerate a response with no optional metadata', () => {
        const response = createResponse({
            meta: {
                err: 'InvalidProgramForExecution',
                fee: 5000n,
                logMessages: null,
                postBalances: [],
                preBalances: [],
            },
        });

        const result = adaptParsedTransaction(response);

        expect(result.meta?.err).toBe('InvalidProgramForExecution');
        expect(result.meta?.logMessages).toBeNull();
        expect(result.meta?.innerInstructions).toBeUndefined();
        expect(result.meta?.loadedAddresses).toBeUndefined();
        expect(result.meta?.computeUnitsConsumed).toBeUndefined();
        expect(result.meta?.costUnits).toBeUndefined();
    });
});

// Returns the dotted path of the first bigint found, so a failure names the offending field.
function findBigIntPath(value: unknown, path = ''): string | undefined {
    if (typeof value === 'bigint') return path || '<root>';
    if (value === null || typeof value !== 'object') return undefined;
    for (const [key, item] of Object.entries(value)) {
        const found = findBigIntPath(item, path ? `${path}.${key}` : key);
        if (found) return found;
    }
    return undefined;
}
