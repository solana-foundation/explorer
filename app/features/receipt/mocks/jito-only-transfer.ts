import { type ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

/**
 * Mock transaction data for testing a Jito-only SOL transfer (single instruction: SOL transfer to a Jito tip account).
 * - Transfer 0.000017343 SOL (17,343 lamports) from R1CHHDEeDwxVxjKv2FPd57mVhbUp4aUQvuE49jYF6Vq
 * - To: ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt
 *
 * Sender: R1CHHDEeDwxVxjKv2FPd57mVhbUp4aUQvuE49jYF6Vq
 * Receiver: ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt
 */
export const mockJitoOnlyTransferTransaction = {
    blockTime: 1770048279,
    meta: {
        computeUnitsConsumed: 70324,
        costUnits: 84616,
        err: null,
        fee: 5000,
        innerInstructions: [],
        logMessages: [
            'Program 11111111111111111111111111111111 invoke [1]',
            'Program 11111111111111111111111111111111 success',
        ],
        postBalances: [56197667482817, 17343, 1],
        postTokenBalances: [],
        preBalances: [56197667482817, 0, 1],
        preTokenBalances: [],
    },
    slot: 397598054,
    transaction: {
        message: {
            accountKeys: [
                {
                    pubkey: new PublicKey('R1CHHDEeDwxVxjKv2FPd57mVhbUp4aUQvuE49jYF6Vq'),
                    signer: true,
                    source: 'transaction' as const,
                    writable: true,
                },
                {
                    pubkey: new PublicKey('ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt'),
                    signer: false,
                    source: 'transaction' as const,
                    writable: true,
                },
                {
                    pubkey: new PublicKey('11111111111111111111111111111111'),
                    signer: false,
                    source: 'transaction' as const,
                    writable: false,
                },
            ],
            instructions: [
                {
                    parsed: {
                        info: {
                            destination: 'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
                            lamports: 17343,
                            source: 'R1CHHDEeDwxVxjKv2FPd57mVhbUp4aUQvuE49jYF6Vq',
                        },
                        type: 'transfer',
                    },
                    program: 'system',
                    programId: new PublicKey('11111111111111111111111111111111'),
                },
            ],
            recentBlockhash: 'sEGK1mZbefsRz5CabeFbvfZL5JhmXYpWmEciY2VA7o9',
        },
        signatures: ['2Pp2vWG88BsebGJWn2AbXcLSkjXWUBJN8ZRYcX4gGTaHQe9h79Bsad77wBM4XB4xK4RvdChR4hsXMf8UdhR2s1Po'],
    },
    version: 'legacy' as const,
} satisfies ParsedTransactionWithMeta;
