import { PublicKey, Transaction } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import {
    intoPartialParsedTransaction,
    intoPartialParsedTransactionFromTransactionInstruction,
    privateUpcastMessageCompiledInstruction,
} from '../parsed-tx';
import { systemProgramTransactionInstructionParser, tokenProgramTransactionInstructionParser } from '../parsers';

describe('intoPartialParsedTransactionFromTransactionInstruction', () => {
    test('should return PartialParsedTransaction compatible data for SystemProgram::transfer transaction instruction', async () => {
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
        // @ts-expect-error parsed is not present at PartiallyDecodedInstruction
        expect(ix.message.instructions[0]?.parsed.type).toEqual('transfer');
    });

    test('should return PartialParsedTransaction compatible data for TokenProgram::transfer transaction instruction', async () => {
        const m = mock.deserializeMessageV0(stubs.tokenTransferMsg);

        const instructions = m.compiledInstructions.map(ci => privateUpcastMessageCompiledInstruction(ci, m));

        const ix = intoPartialParsedTransactionFromTransactionInstruction(
            instructions[3],
            m,
            [],
            tokenProgramTransactionInstructionParser
        );

        expect(ix.message.accountKeys).toEqual([
            {
                pubkey: new PublicKey('6nvUkyJG5j6rH3Hfm15mJNgPMJ1cxHQapfm5K3k647iv'),
                signer: true,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Aoxj61PC8aLZvGw6Ad9QkW2yZGZh1prvUZn8PUghJZfx'),
                signer: true,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('A2UBBBAbLJw6Js5fvqRivd3nNWKD4H612814mUoTp8rC'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Eq6hAvijAYQP4Yw3U1ESDiF7gZdYPfCo2AvD3t31LypQ'),
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
            {
                pubkey: new PublicKey('ComputeBudget111111111111111111111111111111'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('vLbNrN3AGMTGkEmUsLZRUGXEAkFbSkjLTYb2w1fWPn3'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
        ]);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4j667Zcmv9DGioGfNt4Nves34JPP43jGEy4zGcb7Lnsh');
        expect(ix.message.instructions).toHaveLength(1);
        const i = ix.message.instructions[0] as any;
        expect(i.parsed.type).toEqual('transfer');
        expect(i.program).toEqual('spl-token');
        expect(i.parsed.info).toEqual({
            accounts: {
                authority: {
                    address: 'Aoxj61PC8aLZvGw6Ad9QkW2yZGZh1prvUZn8PUghJZfx',
                    role: 2,
                },
                destination: {
                    address: 'A2UBBBAbLJw6Js5fvqRivd3nNWKD4H612814mUoTp8rC',
                    role: 1,
                },
                source: {
                    address: 'Eq6hAvijAYQP4Yw3U1ESDiF7gZdYPfCo2AvD3t31LypQ',
                    role: 1,
                },
            },
            data: { amount: 165355000000n, discriminator: 3 },
            programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        });
    });

    test('should return PartialParsedTransaction compatible data for TokenProgram::transferChecked transaction instruction', async () => {
        const m = mock.deserializeMessage(stubs.tokenTransferCheckedMsg);

        const instructions = m.compiledInstructions.map(ci => privateUpcastMessageCompiledInstruction(ci, m));

        const ix = intoPartialParsedTransactionFromTransactionInstruction(
            instructions[1],
            m,
            [],
            tokenProgramTransactionInstructionParser
        );

        expect(ix.message.accountKeys).toEqual([
            {
                pubkey: new PublicKey('37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ'),
                signer: true,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('CFRWXYp8zc2ftkF2Bv8jXmQu1qW67goZjSkKMjv6UV3P'),
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
            {
                pubkey: new PublicKey('AGRidUXLeDij9CJprkZx7WBXtTQC67jtfiwz293mVrJ'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('ComputeBudget111111111111111111111111111111'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('97PALEbpPj7muiQqi2HXS8QukLsrrr1yfgKfvXjWtsUG'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
        ]);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('3nD586uY1XkvvyNR2tKnC8tRweibv8fbo7mYMH5HGqhD');
        expect(ix.message.instructions).toHaveLength(1);
        const i = ix.message.instructions[0] as any;
        expect(i.parsed.type).toEqual('transferChecked');
        expect(i.program).toEqual('spl-token');
        expect(i.parsed.info).toEqual({
            accounts: {
                authority: {
                    address: '37vWB5RfLRpnhNobhzmwCRGZbynGd4je2NvppSjUsEdJ',
                    role: 3,
                },
                destination: {
                    address: 'CFRWXYp8zc2ftkF2Bv8jXmQu1qW67goZjSkKMjv6UV3P',
                    role: 1,
                },
                mint: {
                    address: 'AGRidUXLeDij9CJprkZx7WBXtTQC67jtfiwz293mVrJ',
                    role: 0,
                },

                source: {
                    address: '4aa42XQFo45wc2PHQH21vahuyuFYCEZAH4G27xpGYqf6',
                    role: 1,
                },
            },
            data: { amount: 1000000000000000n, decimals: 6, discriminator: 12 },
            programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        });
    });
});
