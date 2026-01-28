import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a transaction with a custom fee payer.
 * - Transfer 0.5 SOL (500,000,000 lamports) from Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - To: G2GjouKPJnGi3aGVsHnBu475EGvseiL1QnVHBMkN6wid
 * - Fee payer: 644RudhReGpiHsNysSVSpDDagrzw5mBCwdHq1ZNwK6zL (pays 10,000 lamports fee)
 * - Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5 (pays transfer amount)
 *
 * This transaction has 2 signers: the fee payer and the sender.
 */
export const mockCustomFeePayerTransaction = {
    blockTime: 1769093093,
    meta: {
        computeUnitsConsumed: 150,
        costUnits: 2501,
        err: null,
        fee: 10000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [449980000, 64579299131, 590000000, 1],
        postTokenBalances: [],
        preBalances: [449990000, 65079299131, 90000000, 1],
        preTokenBalances: [],
    },
    slot: 436905636,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: new PublicKey('644RudhReGpiHsNysSVSpDDagrzw5mBCwdHq1ZNwK6zL'),
                    signer: true,
                    source: 'transaction',
                    writable: true,
                },
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
                            lamports: 500000000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: 'A9Pd86j8WcF63pn1m21njYmVdkhPbb1E5a1vFkzbuSzM',
        },
        signatures: [
            '2MDTSo3dg7UxMnMhQVMVT2uVs5HzKrFjgoRmPwM8g951RZLhGeRcxZc9d1StzFR2FAmfKX8kbB5ZTjcu5vpXKAVN',
            'R6YbzNromQCt2kx1YiVGpBT89zNg7zDBKge9yMreUgz5dYDdPWFCi6ffYy2jtvNdn7hEQiMeJKM5NNsRuQf5auy',
        ],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
