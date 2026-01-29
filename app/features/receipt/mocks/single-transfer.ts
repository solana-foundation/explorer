import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a single SOL transfer.
 * - Transfer 0.3 SOL (300,000,000 lamports) from Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - To: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
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
                    pubkey: new PublicKey('Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5'),
                    signer: true,
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
                            destination: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                            lamports: 300000000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
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
