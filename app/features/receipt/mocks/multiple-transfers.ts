import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

import { RECEIVER, RECEIVER_2, SENDER } from './addresses';

/**
 * Mock transaction data for testing multiple transfers.
 * - Transfer 0.08 SOL to RECEIVER
 * - Transfer 0.05 SOL to RECEIVER_2
 * - Transfer 0.01 SOL to RECEIVER
 *
 * Sender: SENDER
 */
export const mockMultipleTransfersTransaction = {
    blockTime: 1768831450,
    meta: {
        computeUnitsConsumed: 450,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [50601134451, 50000000, 90000000, 1],
        postTokenBalances: [],
        preBalances: [50741139451, 0, 0, 1],
        preTokenBalances: [],
    },
    slot: 436228237,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: SENDER.publicKey,
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: RECEIVER.publicKey,
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: RECEIVER_2.publicKey,
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
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            destination: RECEIVER.publicKey.toBase58(),
                            lamports: 80000000,
                            source: SENDER.publicKey.toBase58(),
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
                {
                    parsed: {
                        info: {
                            destination: RECEIVER_2.publicKey.toBase58(),
                            lamports: 50000000,
                            source: SENDER.publicKey.toBase58(),
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
                {
                    parsed: {
                        info: {
                            destination: RECEIVER.publicKey.toBase58(),
                            lamports: 10000000,
                            source: SENDER.publicKey.toBase58(),
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: 'AHK7TnmvzPAk4WsmWqVgL7v6YccGkANoWUmrSY7aQDzw',
        },
        signatures: ['5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
