import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a USDC token transfer (regular transfer, not transferChecked).
 * - Transfer 1 USDC (1,000,000 with 6 decimals) from HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT
 * - To: 3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX
 * - Authority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * Receiver: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 */
export const mockUsdcRegularTransferTransaction = {
    blockTime: 1769153097,
    meta: {
        computeUnitsConsumed: 4644,
        costUnits: 6306,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: Transfer',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4644 of 200000 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        ],
        postBalances: [69079294131, 2039280, 2039280, 8738370969],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '2000000', decimals: 6, uiAmount: 2, uiAmountString: '2' },
            },
            {
                accountIndex: 2,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '18000000', decimals: 6, uiAmount: 18, uiAmountString: '18' },
            },
        ],
        preBalances: [69079299131, 2039280, 2039280, 8738370969],
        preTokenBalances: [
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
    },
    slot: 437061029,
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
                            amount: '1000000',
                            authority: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                            destination: '3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX',
                            source: 'HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT',
                        },
                        type: 'transfer',
                    },
                    program: 'spl-token',
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                },
            ],
            recentBlockhash: '743Rt1RW3WXopRLzgGBABuUj7p3rEf23fZsBYusicmZJ',
        },
        signatures: ['5CBBFXjdu32noWfSdzAdiEBad73ZmMChN17CEFeTLiQQJZBMzL4J9dj7YLcaag8z6xKiBws7GVPeQ7KmUGiozC4Z'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
