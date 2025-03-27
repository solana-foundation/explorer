import { ComputeBudgetProgram, PublicKey, SystemProgram } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoParsedTransactionFromMessage } from '../parsed-tx';

describe('intoParsedTransactionFromMessage', () => {
    test("should return ParsedTransaction compatible data for SystemProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);
        const ix = intoParsedTransactionFromMessage(m);

        expect(ix.message.accountKeys).toHaveLength(4);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3');
        expect(ix.message.instructions).toHaveLength(1);
        expect(ix.message.instructions[0]).toEqual({
            accounts: [
                new PublicKey('9yrYKJxZKktutPzhUNgS92bzVjpHkgZPNpZCHRr6M2TC'),
                new PublicKey('2vPuXtAJLtxmkJRhuEwCuvUKyRemreh7q1DR4ns7wwzL'),
            ],
            data: '3Bxs4Bc3VYuGVB19',
            programId: SystemProgram.programId,
        });
        expect(ix.signatures).toHaveLength(2);
    });

    test("should return ParsedTransaction compatible data for TokenProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);
        const ix = intoParsedTransactionFromMessage(m);

        expect(ix.message.accountKeys).toHaveLength(11);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4j667Zcmv9DGioGfNt4Nves34JPP43jGEy4zGcb7Lnsh');
        expect(ix.message.instructions).toHaveLength(4);
        expect(ix.message.instructions).toEqual([
            {
                accounts: [],
                data: '3iVJGp49HEgw',
                programId: ComputeBudgetProgram.programId,
            },
            {
                accounts: [],
                data: 'EBJyb5',
                programId: ComputeBudgetProgram.programId,
            },
            {
                accounts: [
                    '6nvUkyJG5j6rH3Hfm15mJNgPMJ1cxHQapfm5K3k647iv',
                    'A2UBBBAbLJw6Js5fvqRivd3nNWKD4H612814mUoTp8rC',
                    'vLbNrN3AGMTGkEmUsLZRUGXEAkFbSkjLTYb2w1fWPn3',
                    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    '11111111111111111111111111111111',
                    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                    'SysvarRent111111111111111111111111111111111',
                ].map(k => new PublicKey(k)),
                data: '2',
                programId: new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ADDRESS),
            },
            {
                accounts: [
                    'Eq6hAvijAYQP4Yw3U1ESDiF7gZdYPfCo2AvD3t31LypQ',
                    'A2UBBBAbLJw6Js5fvqRivd3nNWKD4H612814mUoTp8rC',
                    'Aoxj61PC8aLZvGw6Ad9QkW2yZGZh1prvUZn8PUghJZfx',
                ].map(k => new PublicKey(k)),
                data: '3maqxKJxvvF9',
                programId: new PublicKey(TOKEN_PROGRAM_ADDRESS),
            },
        ]);
        expect(ix.signatures).toHaveLength(2);
    });
});
