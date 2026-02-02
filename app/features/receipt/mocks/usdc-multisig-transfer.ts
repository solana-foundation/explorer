import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a USDC token transfer with multisig authority.
 * - Transfer 1 USDC (1,000,000 with 6 decimals)
 * - Uses multisigAuthority instead of authority
 * - MultisigAuthority: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5
 * - Mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 *
 * Sender: Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5 (multisig authority)
 * Receiver: 65MUMxiopKUaZbazs6pRUr9y774mj4Z1TdDgUh3L2Fhk
 */
export const mockUsdcMultisigTransferTransaction = {
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
                            destination: '3MRBUAxwx7gWoGvAtzxLtzmhzwPDGAEqStKWb8cJnYQX',
                            mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                            multisigAuthority: 'Hd3f3TdvcEqEEkCE5pV8qZxtw4CRZ82SU8ggYVR3bD5',
                            source: 'HYsC1ge3Yo1sSBFvcEn4otFZEJkitUNZYPsDVTQNacBT',
                            tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
                        },
                        type: 'transferChecked',
                    },
                    program: 'spl-token',
                    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                },
            ],
            recentBlockhash: 'Eo7YPFE1694LpMwhb5RygaJJBfNzbVGz383Y2uErk9uS',
        },
        signatures: ['3xyzMultisigSignature123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP'],
    },
    version: 'legacy',
} satisfies ParsedTransactionWithMeta;
