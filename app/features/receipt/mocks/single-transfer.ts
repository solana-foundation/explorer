import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

import { RECEIVER, SENDER } from './addresses';

/**
 * Mock transaction data for testing a single SOL transfer.
 * - Transfer 0.3 SOL (300,000,000 lamports) from SENDER to RECEIVER
 */
export const mockSingleTransferTransaction = {
    blockTime: 1769070902,
    meta: {
        computeUnitsConsumed: 150,
        costUnits: 1481,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [55179299131, 350000000, 1],
        postTokenBalances: [],
        preBalances: [55479304131, 50000000, 1],
        preTokenBalances: [],
    },
    slot: 436848066,
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
                            lamports: 300000000,
                            source: SENDER.publicKey.toBase58(),
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: '6MgFAucojhVLnxc6bfvjpn72bnCoGRA7runiGiRg7xtv',
        },
        signatures: ['pBApPVmSKwvLmGahzW7ZKHmqLuPNXpwJR3n37HQ4B279AG4JmfUWJRd9NnaaQAxJZ5npdoFj6r6iZ2cvoYdorFg'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
