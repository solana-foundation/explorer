import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a USDC token transfer.
 * - Transfer 1 USDC (1,000,000 with 6 decimals) from HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT
 * - To: 3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX
 * - Authority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * Receiver: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 */
export const mockUsdcTransferTransaction = {
    blockTime: 1769070184,
    meta: {
        computeUnitsConsumed: 6349,
        costUnits: 8012,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6199 of 6349 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program ComputeBudget111111111111111111111111111111 invoke [1]',
            'Program ComputeBudget111111111111111111111111111111 success',
        ],
        postBalances: [55479304131, 2039280, 2039280, 1, 8738370969, 188340812685],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
            {
                accountIndex: 2,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '19000000', decimals: 6, uiAmount: 19, uiAmountString: '19' },
            },
        ],
        preBalances: [55479309131, 2039280, 2039280, 1, 8738370969, 188340812685],
        preTokenBalances: [
            {
                accountIndex: 1,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '0', decimals: 6, uiAmount: null, uiAmountString: '0' },
            },
            {
                accountIndex: 2,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '20000000', decimals: 6, uiAmount: 20, uiAmountString: '20' },
            },
        ],
    },
    slot: 436846205,
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
                    pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
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
                            destination: '3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX',
                            mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                            source: 'HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT',
                            tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
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
