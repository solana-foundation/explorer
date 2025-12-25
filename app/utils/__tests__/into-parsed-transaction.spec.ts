import { PublicKey, SystemProgram, VersionedTransaction } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoParsedTransaction } from '../parsed-tx';

describe('intoParsedTransaction', () => {
    test("should return ParsedTransaction compatible data for SystemProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);
        const t = intoParsedTransaction(new VersionedTransaction(m));

        expect(t.message.accountKeys).toHaveLength(4);
        expect(t.message.addressTableLookups).toHaveLength(0);
        expect(t.message.recentBlockhash).toEqual('4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3');
        expect(t.message.instructions).toHaveLength(1);
        expect(t.message.instructions[0]).toEqual({
            accounts: [
                new PublicKey('9yrYKJxZKktutPzhUNgS92bzVjpHkgZPNpZCHRr6M2TC'),
                new PublicKey('2vPuXtAJLtxmkJRhuEwCuvUKyRemreh7q1DR4ns7wwzL'),
            ],
            data: '3Bxs4Bc3VYuGVB19',
            programId: SystemProgram.programId,
        });
        expect(t.signatures).toHaveLength(2);
    });
});
