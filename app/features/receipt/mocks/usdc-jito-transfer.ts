import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a USDC transfer with a Jito tip.
 * - TransferChecked 1 USDC (1,000,000 with 6 decimals) from HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT
 *   to 3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX (authority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5)
 * - System transfer 10,000 lamports (Jito tip) from Hd3f3... to 96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 */
export const mockUsdcJitoTransferTransaction = {
    blockTime: 1769770869,
    meta: {
        computeUnitsConsumed: 6349,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
            'Program log: Instruction: TransferChecked',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6199 of 203000 compute units',
            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [74063639371, 2039280, 77333564515, 2039280, 1, 193278062685, 8738370969],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '3000000', decimals: 6, uiAmount: 3, uiAmountString: '3' },
            },
            {
                accountIndex: 3,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '17000000', decimals: 6, uiAmount: 17, uiAmountString: '17' },
            },
        ],
        preBalances: [74063654371, 2039280, 77333554515, 2039280, 1, 193278062685, 8738370969],
        preTokenBalances: [
            {
                accountIndex: 1,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: '65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '2000000', decimals: 6, uiAmount: 2, uiAmountString: '2' },
            },
            {
                accountIndex: 3,
                mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                owner: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                uiTokenAmount: { amount: '18000000', decimals: 6, uiAmount: 18, uiAmountString: '18' },
            },
        ],
    },
    slot: 438674743,
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
                    pubkey: new PublicKey('3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
                    signer: false,
                    source: 'transaction',
                    writable: false,
                },
                {
                    pubkey: new PublicKey('HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT'),
                    signer: false,
                    source: 'transaction',
                    writable: true,
                },
                {
                    pubkey: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'),
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
                    parsed: {
                        info: {
                            destination: '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
                            lamports: 10000,
                            source: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: '62siRk4B4LEiXWsFs6qXrkb86cZT4LTEiP6upV29Rek',
        },
        signatures: ['3XZac8fbGwoyDWjzWYhakLxPqaHYmGM9zG4aNnRKshyCzod5UaQPbjQP2mWaCDADoZ43JrVA3q42xEr5Psuty4at'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
