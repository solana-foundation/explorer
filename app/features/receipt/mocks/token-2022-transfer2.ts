import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const TOKEN_2022_PROGRAM_ADDRESS = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

/**
 * Mock transaction data for testing a Token-2022 transfer (transfer2 instruction).
 * - Transfer 100 tokens (100 with 0 decimals) via Token-2022 program
 * - From (source): 3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX (sender Hd3f3's ATA)
 * - To (destination): HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT (receiver 65MUM's ATA)
 * - Authority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - Mint: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU (example T22 mint)
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * Receiver: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 */
export const mockToken2022Transfer2Transaction = {
    blockTime: 1769200000,
    meta: {
        computeUnitsConsumed: 6500,
        costUnits: 8012,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} invoke [1]`,
            'Program log: Instruction: Transfer (Checked)',
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} consumed 6199 of 6500 compute units`,
            `Program ${TOKEN_2022_PROGRAM_ADDRESS} success`,
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
        ],
        postBalances: [55479304131, 2039280, 2039280, 1, 8738370969, 188340812685],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '100', decimals: 0, uiAmount: 100, uiAmountString: '100' },
            },
            {
                accountIndex: 2,
                mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '900', decimals: 0, uiAmount: 900, uiAmountString: '900' },
            },
        ],
        preBalances: [55479309131, 2039280, 2039280, 1, 8738370969, 188340812685],
        preTokenBalances: [
            {
                accountIndex: 1,
                mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '0', decimals: 0, uiAmount: null, uiAmountString: '0' },
            },
            {
                accountIndex: 2,
                mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: TOKEN_2022_PROGRAM_ADDRESS,
                uiTokenAmount: { amount: '1000', decimals: 0, uiAmount: 1000, uiAmountString: '1000' },
            },
        ],
    },
    slot: 437100000,
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
                    pubkey: new PublicKey('HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('ComputeBudget111111111111111111111111111111'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey('11111111111111111111111111111111'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey(TOKEN_2022_PROGRAM_ADDRESS),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            authority: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                            destination: 'HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT',
                            mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                            source: '3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX',
                            tokenAmount: { amount: '100', decimals: 0, uiAmount: 100, uiAmountString: '100' },
                        },
                        type: 'transfer2',
                    },
                    program: 'spl-token-2022',
                    programId: new PublicKey(TOKEN_2022_PROGRAM_ADDRESS),
                },
                {
                    accounts: [],
                    data: 'KL8Bcb',
                    programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
                },
            ],
            recentBlockhash: 'Eo7YPFE1694LpMwhb5RygaJJBfNzbVGz383Y2uErk9uS',
        },
        signatures: ['2cQ1xf4meFvQBcmhyAtnXQzWbqNWvy3eQrgWPov3EQbnj2WGpLzChjJrVopFURRCWeNyKe8grXk4hmcv3EFd7iA8'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
