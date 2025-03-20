import { PublicKey, Transaction } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoPartialParsedTransaction, privateUpcastMessageCompiledInstruction } from '../parsed-tx';
import { systemProgramTransactionInstructionParser } from '../parsers';

/**
 * This suite covers conversion based on Transaction and VersionedTransaction. Instruction-specific cases are covered in the separate test-suite
 */
describe('intoPartialParsedTransaction', () => {
    test('should return PartialParsedTransaction compatible data for SystemProgram::transfer transaction', async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        const instructions = m.compiledInstructions.map(ci => privateUpcastMessageCompiledInstruction(ci, m));

        // Assume that we use transaction having the message only
        const tx = {
            compileMessage() {
                return m;
            },
            instructions,
            signatures: [],
        } as unknown as Transaction;

        const ix = intoPartialParsedTransaction(tx, 0, systemProgramTransactionInstructionParser);

        expect(ix.message.accountKeys).toEqual([
            {
                pubkey: new PublicKey('HFKZMufXXi8eQ7gguP7yyhhJDr5ztdP6v5ppN2DQEeth'),
                signer: true,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('9yrYKJxZKktutPzhUNgS92bzVjpHkgZPNpZCHRr6M2TC'),
                signer: true,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('2vPuXtAJLtxmkJRhuEwCuvUKyRemreh7q1DR4ns7wwzL'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('11111111111111111111111111111111'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
        ]);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3');
        expect(ix.message.instructions).toHaveLength(1);
    });
});
