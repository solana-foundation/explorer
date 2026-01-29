import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing multiple transfers.
 * - Transfer 0.08 SOL to G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid
 * - Transfer 0.05 SOL to 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 * - Transfer 0.01 SOL to G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
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
                    pubkey: new PublicKey('Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5'),
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk'),
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
                            destination: 'G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid',
                            lamports: 80000000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
                {
                    parsed: {
                        info: {
                            destination: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                            lamports: 50000000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
                {
                    parsed: {
                        info: {
                            destination: 'G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid',
                            lamports: 10000000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
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
