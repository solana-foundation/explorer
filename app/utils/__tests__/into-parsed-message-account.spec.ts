import { AccountMeta, Keypair, PublicKey } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoParsedMessageAccount } from '../parsed-tx';

describe('intoParsedMessageAccount', () => {
    test('should return ParsedMessageAccount compatible data for AccountMeta', async () => {
        const accountMeta: AccountMeta = {
            isSigner: false,
            isWritable: false,
            pubkey: Keypair.generate().publicKey,
        };
        expect(intoParsedMessageAccount([accountMeta])).toEqual([
            {
                pubkey: accountMeta.pubkey,
                signer: false,
                source: 'transaction',
                writable: false,
            },
        ]);
    });

    test('should return ParsedMessageAccount compatible data for Message', async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        expect(intoParsedMessageAccount(m)).toEqual([
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
    });

    test('should return ParsedMessageAccount compatible data for MessageV0', async () => {
        const m = mock.deserializeMessageV0(stubs.aTokenCreateIdempotentMsg);

        expect(intoParsedMessageAccount(m)).toEqual([
            {
                pubkey: new PublicKey('EzdQH5zUfTMGb3vwU4oumxjVcxKMDpJ6dB78pbjfHmmb'),
                signer: true,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('2qZ3FFpD9kPVS3MRYQNDGqfrh6JzjNpqXNp5kopv2PMk'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('3wrAqm2ouWgzVnk7Cxv2GbM6VUeGBtZuSEakApjQk4VZ'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('4ahjvr2TN7yViD8b54S1TCC2CokRfSBYErYT3Zd7rK9u'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('6LXAHyQ9AZs8LcQoUqpj6RswaZGxkM6vmx9CPDoiy8cd'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('8DKit81gfTDtTYN4SMWHwAc3UJywbHNEJThXjLrzb17s'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('8czgpWaHCjyXpLAUqqZqWZEw4ZYrAonfaKyLCRN2M58X'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('9hDBGGCrLwQtdxbw2TUzpzLEZM8psxVBhBpbJDAMibq6'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('9jPRczqDFNkuQyF6MBhnsZqyURUzNJzGXpNM1NxxocQF'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('AUN7WQptCU5qSgmDSDtiSzQivQVhmTfDndJgEtj2RDD6'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('AZYJEfo2mjqLV3PsCPcDjmgyDnyq9ur5KCgbpCJokXLf'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Big1xZ1pnMdrjkF3buyJTC2kfKgmrRVgBN7dpekF5LCd'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('ENE5MsxSPqoKVg2TH2QabAKRBRwdsAq2cMiqydsnSN4s'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('F3AwqJLiqFUGQnfq8QVEtJQWRPztq2WmuFEgfE1L2Nb7'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Fv8YYjF2DUqj9RZhyXNzXa4yR9nHHwjg5bFjA82UidF1'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('GjFdibHr9YDtqnKW3pc7ChzmsqWeptvVwQijAnY3LkLb'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Guo7CcsFvD8BrRPppdGZ9cRjXqjNYD33nHiN2gdijzdj'),
                signer: false,
                source: 'transaction',
                writable: true,
            },
            {
                pubkey: new PublicKey('Ht7TduEGJjBMDXXozEUMJPq592r8x33UXuLdD5uPFc5m'),
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
                pubkey: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
            {
                pubkey: new PublicKey('74SBV4zDXxTRgv1pEMoECskKBkZHc2yGPnc7GYVepump'),
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
                pubkey: new PublicKey('D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf'),
                signer: false,
                source: 'transaction',
                writable: false,
            },
        ]);
    });
});
