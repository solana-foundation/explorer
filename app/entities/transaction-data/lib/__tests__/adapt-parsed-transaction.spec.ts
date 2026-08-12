import { describe, expect, it } from 'vitest';

import { adaptParsedTransaction, type RpcParsedTransaction } from '../adapt-parsed-transaction';

const FEE_PAYER = '11111111111111111111111111111112';
const RECIPIENT = '11111111111111111111111111111113';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const BLOCKHASH = '9vHo1dQ6H2XZ1g6TbsbT1T1zuHz39qrkAPGe2f4tXU5V';

function createResponse(overrides: Partial<RpcParsedTransaction> = {}): RpcParsedTransaction {
    return {
        blockTime: 1_778_761_079n,
        meta: {
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
            logMessages: ['Program 11111111111111111111111111111111 invoke [1]'],
            postBalances: [900_000_000n, 100_000_000n],
            postTokenBalances: [
                {
                    accountIndex: 1,
                    mint: MINT,
                    owner: RECIPIENT,
                    programId: SYSTEM_PROGRAM,
                    uiTokenAmount: { amount: '15000000', decimals: 6, uiAmount: 15, uiAmountString: '15' },
                },
            ],
            preBalances: [1_000_000_000n, 0n],
        },
        slot: 372_654_321n,
        transaction: {
            message: {
                accountKeys: [
                    { pubkey: FEE_PAYER, signer: true, source: 'transaction', writable: true },
                    { pubkey: RECIPIENT, signer: false, source: 'lookupTable', writable: true },
                ],
                instructions: [
                    {
                        parsed: { info: { lamports: 100_000_000 }, type: 'transfer' },
                        program: 'system',
                        programId: SYSTEM_PROGRAM,
                    },
                ],
                recentBlockhash: BLOCKHASH,
            },
            signatures: ['5xyz'],
        },
        version: 0,
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
    });

    it.each(['legacy' as const, 0 as const, 1 as const])('should carry version %s through', version => {
        expect(adaptParsedTransaction(createResponse({ version })).version).toBe(version);
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
